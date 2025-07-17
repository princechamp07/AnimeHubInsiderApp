import axios from 'axios';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type Props = {
	animeId: string;
	slug: string;
	episode: number;
	language: string;
};

const WatchPlayer = ({ animeId, episode, language, slug }: Props) => {
	const webviewRef = useRef(null);
	const [server, setServer] = useState<'hd1' | 'hd2' | 'hd3'>('hd1');
	const [loading, setLoading] = useState(true);
	const [source, setSource] = useState<{ html?: string; uri?: string } | null>(null);

	const embedUrl =
		server === 'hd1'
			? `https://vidsrc.cc/v2/embed/anime/${animeId}/${episode}/${language}?autoPlay=true`
			: server === 'hd2'
				? `https://vidapi.xyz/embed/anime/${slug}${language === 'dub' ? '-dub' : ''}-episode-${episode}`
				: `https://2anime.xyz/embed/${slug}${language === 'dub' ? '-dub' : ''}-episode-${episode}`;

	useEffect(() => {
		loadVideo();
		ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
		return () => {
			ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
		};
	}, [server, episode]);

	const loadVideo = async () => {
		setLoading(true);
		try {
			let finalEmbedUrl = embedUrl;

			// For hd2 (vidapi), extract the iframe src first
			if (server === 'hd2') {
				const res = await axios.get(embedUrl, {
					headers: { 'User-Agent': 'Mozilla/5.0' }
				});
				const html = res.data;

				const match = html.match(/<iframe[^>]*id=["']vsrcs["'][^>]*src=["']([^"']+)["']/i);
				const extractedSrc = match?.[1];

				if (extractedSrc?.includes('2anime.xyz')) {
					finalEmbedUrl = extractedSrc;
				}
			}

			if (server === 'hd3' || server === 'hd2') {
				// Now treat both hd3 and hd2 as 2anime iframe loaders
				const res = await axios.get(finalEmbedUrl, {
					headers: { 'User-Agent': 'Mozilla/5.0' }
				});
				const html = res.data;

				const match = html.match(/<iframe[^>]*id=["']iframesrc["'][^>]*data-src=["']([^"']+)["']/i);
				const iframeSrc = match?.[1];

				if (iframeSrc) {

					if (iframeSrc.includes('player4u.xyz')) {
						console.warn('⚠️ player4u detected in iframe source — fallback to HD1');
						setServer('hd1');
						return;
					}

					const wrappedHtml = `
						<!DOCTYPE html>
						<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
						<style>body,html{margin:0;padding:0;background:black;height:100%}iframe{width:100%;height:100%;border:none}</style>
						</head><body>
						<iframe src="${iframeSrc}" allow="autoplay; fullscreen" allowfullscreen></iframe>
						<script>
						// your cleaning and ad-blocking JS goes here
						</script>
						</body></html>
					`;
					setSource({ html: wrappedHtml });
				} else {
					setSource({ html: '<h3 style="color:white;text-align:center;">❌ Failed to load video iframe.</h3>' });
				}
			} else {
				// hd1 or default
				setSource({ uri: embedUrl });
			}
		} catch (error) {
			console.error(error);
			setSource({ html: '<h3 style="color:white;text-align:center;">⚠️ Failed to load video.</h3>' });
		} finally {
			setLoading(false);
		}
	};


	const handleMessage = async (event: WebViewMessageEvent) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);
			if (data.fullscreen) {
				await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
			} else {
				await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
			}
		} catch (err) {
			console.log('Orientation error:', err);
		}
	};


	const handleRequest = (event: any) => {
		try {
			const requestedUrl = new URL(event.url);
			const allowedUrl = new URL(embedUrl);

			// ✅ List of explicitly blocked domains
			const blockedHosts = ['player4u.xyz'];

			// ❌ Block if host is in blocked list
			if (blockedHosts.some(host => requestedUrl.hostname.includes(host))) {
				console.log('❌ Blocked malicious host:', requestedUrl.hostname);
				return false;
			}

			// ✅ Allow if domain is same as embed source
			if (requestedUrl.hostname === allowedUrl.hostname) {
				return true;
			}

			// ✅ Optionally allow trusted CDN or video delivery subdomains
			const trustedDomains = ['vidsrc.cc', 'vidapi.xyz', '2anime.xyz'];
			if (trustedDomains.some(host => requestedUrl.hostname.endsWith(host))) {
				return true;
			}

			console.log('❌ Blocked redirect:', requestedUrl.href);
			return false;
		} catch (error) {
			console.log('❌ Error parsing URL:', error);
			return false;
		}
	};


	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
			<View className="h-72 w-full bg-black">
				{loading || !source ? (
					<ActivityIndicator size="large" color="#00f" className="mt-10" />
				) : (
					<WebView
						ref={webviewRef}
						originWhitelist={['*']}
						source={source}
						javaScriptEnabled
						domStorageEnabled
						allowsFullscreenVideo
						allowsInlineMediaPlayback
						mediaPlaybackRequiresUserAction={false}
						onMessage={handleMessage}
						onShouldStartLoadWithRequest={handleRequest}
					/>
				)}
			</View>

			<View className="mt-2 px-4">
				<Text className="text-sm text-center text-gray-600 dark:text-gray-400">
					If the video keeps loading, try switching between HD2/HD3.
				</Text>
			</View>

			<View className="flex-row justify-center mt-3 space-x-4">
				{(['hd1', 'hd2', 'hd3'] as const).map((s) => (
					<TouchableOpacity
						key={s}
						onPress={() => setServer(s)}
						className={`px-4 ml-4 py-1 rounded-full ${server === s ? 'bg-blue-600' : 'bg-gray-300'}`}
					>
						<Text className={server === s ? 'text-white font-semibold' : 'text-black'}>
							{s.toUpperCase()}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</SafeAreaView>
	);
};

export default WatchPlayer;
