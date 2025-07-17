import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
	const [server, setServer] = useState<'hd1' | 'hd2'>('hd1');

	const embedUrl =
		server === 'hd1'
			? `https://vidsrc.cc/v2/embed/anime/${animeId}/${episode}/${language}?autoPlay=true`
			: `https://vidapi.xyz/embed/anime/${slug}${language === 'dub' ? '-dub' : ''}-episode-${episode}`;

	useEffect(() => {
		ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
		return () => {
			ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
		};
	}, []);

	const injectedJavaScript = `
		window.open = () => null;
		window.alert = () => null;
		window.confirm = () => null;
		window.prompt = () => null;
		window.print = () => null;

		// Block right-click
		document.addEventListener('contextmenu', e => e.preventDefault());

		// Intercept all anchor clicks
		document.addEventListener('click', (e) => {
			const target = e.target.closest('a');
			if (target && target.href) {
				e.preventDefault();
				e.stopPropagation();
			}
		}, true);

		// Remove all ad/pop/overlay elements continuously
		const cleanAds = () => {
			const selectors = [
				'iframe[src*="ads"]',
				'div[id*="ads"]',
				'div[class*="ad"]',
				'div[class*="popup"]',
				'div[class*="overlay"]',
				'div[class*="modal"]',
				'div[class*="banner"]',
				'div[class*="sponsor"]',
				'div[class*="backdrop"]',
				'.adsbox',
				'.vignette',
				'.google-auto-placed',
				'.ytp-ad-module',
				'[onclick*="popup"]',
				'a[target="_blank"]',
			];

			selectors.forEach((sel) => {
				document.querySelectorAll(sel).forEach((el) => el.remove());
			});

			// Remove fixed high z-index overlays
			document.querySelectorAll('body *').forEach(el => {
				try {
					const style = window.getComputedStyle(el);
					if ((style.position === 'fixed' || style.position === 'sticky') && parseInt(style.zIndex) > 999) {
						el.remove();
					}
				} catch {}
			});
		};

		setInterval(() => {
			cleanAds();
		}, 500);

		const observer = new MutationObserver(cleanAds);
		observer.observe(document.body, { childList: true, subtree: true });

		document.addEventListener('fullscreenchange', () => {
			const isFullscreen = !!document.fullscreenElement;
			window.ReactNativeWebView?.postMessage(JSON.stringify({ fullscreen: isFullscreen }));
		});

		true;
	`;

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

	// ❌ BLOCK all URLs that are not exactly the embed URL
	const handleRequest = (event: any) => {
		try {
			const requested = new URL(event.url);
			const allowed = new URL(embedUrl);

			const isSameHost = requested.hostname === allowed.hostname;
			const isExact = event.url === embedUrl;

			if (!isSameHost || !isExact) {
				console.log('❌ Blocked redirect:', event.url);
				return false;
			}

			return true;
		} catch {
			return false;
		}
	};

	return (
		<SafeAreaView>
			{/* Player */}
			<View className="bg-black h-72 w-full mt-2">
				<WebView
					ref={webviewRef}
					source={{ uri: embedUrl }}
					javaScriptEnabled
					domStorageEnabled
					allowsFullscreenVideo
					allowsInlineMediaPlayback
					mediaPlaybackRequiresUserAction={false}
					injectedJavaScript={injectedJavaScript}
					onMessage={handleMessage}
					onShouldStartLoadWithRequest={handleRequest}
					originWhitelist={['*']}
					javaScriptCanOpenWindowsAutomatically={false}
				/>
			</View>

			{/* Playback tip */}
			<View className="mt-2 px-4">
				<Text className="text-sm text-center text-gray-600 dark:text-gray-400">
					If the video keeps loading, try clicking another episode or switch server between HD1 and HD2.
				</Text>
			</View>

			{/* Server Switch */}
			<View className="flex-row justify-center mt-3 space-x-4">
				{(['hd1', 'hd2'] as const).map((s) => (
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
