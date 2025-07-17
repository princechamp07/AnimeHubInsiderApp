import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type Props = {
    movieId: string;
    ImdbId: string;
    activeServer: 'vidsrc-cc' | 'vidsrc-icu' | 'vidsrc-pk';
};

const MovieWatchPlayer = ({ movieId, ImdbId, activeServer }: Props) => {
    const webviewRef = useRef(null);
    const [useFallback, setUseFallback] = useState(false);

    console.log(movieId, ImdbId)

    const getEmbedUrl = (): string => {
        if (activeServer === 'vidsrc-cc') {
            return `https://vidsrc.cc/v2/embed/movie/${useFallback ? ImdbId : movieId}?autoPlay=true`;
        } else if (activeServer === 'vidsrc-icu') {
            return `https://www.2embed.cc/embed/${ImdbId}`;
        } else {
            return `https://embed.vidsrc.pk/movie/${ImdbId}?autoPlay=true`;
        }
    };

    const embedUrl = getEmbedUrl();

    const iframeHtml = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
				body, html {
					margin: 0;
					padding: 0;
					background-color: black;
					height: 100%;
					overflow: hidden;
				}
				iframe {
					border: 0;
					width: 100%;
					height: 100%;
				}
			</style>
		</head>
		<body>
			<iframe 
				src="${embedUrl}" 
				allowfullscreen 
				scrolling="no" 
				allow="autoplay; fullscreen"
			></iframe>
			<script>
				window.open = () => null;
				window.alert = () => null;
				window.confirm = () => null;
				window.prompt = () => null;
				document.addEventListener('contextmenu', e => e.preventDefault());

				document.addEventListener('click', (e) => {
					const a = e.target.closest('a');
					if (a) e.preventDefault();
				}, true);

				document.addEventListener('fullscreenchange', () => {
					const isFullscreen = !!document.fullscreenElement;
					window.ReactNativeWebView?.postMessage(JSON.stringify({ fullscreen: isFullscreen }));
				});
			</script>
		</body>
		</html>
	`;

    useEffect(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

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
        const allowedHostnames = [
            'vidsrc.cc', 'vidsrc.to', 'vidsrc.pk',
            'www.vidsrc.cc', 'www.vidsrc.to', 'www.vidsrc.pk',
            '2embed.cc', '2embed.skin', '2embed.to',
            'www.2embed.cc', 'www.2embed.skin', 'www.2embed.to',
        ];

        try {
            const incomingHost = new URL(event.url).hostname;
            const isAllowed = allowedHostnames.includes(incomingHost);
            if (!isAllowed) {
                console.log('❌ Blocked redirect:', event.url);
            }
            return isAllowed;
        } catch {
            return false;
        }
    };

    const handleWebViewError = () => {
        if (!useFallback && activeServer === 'vidsrc-cc') {
            console.warn('⚠️ Primary embed failed. Using fallback IMDb...');
            setUseFallback(true);
        }
    };

    return (
        <SafeAreaView>
            <View className="bg-black h-72 w-full">
                {activeServer === 'vidsrc-icu' ? (
                    <WebView
                        ref={webviewRef}
                        originWhitelist={['*']}
                        source={{ html: iframeHtml }}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                        allowsInlineMediaPlayback
                        mediaPlaybackRequiresUserAction={false}
                        onMessage={handleMessage}
                        onError={handleWebViewError}
                    />
                ) : (
                    <WebView
                        ref={webviewRef}
                        source={{ uri: embedUrl }}
                        originWhitelist={['*']}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                        allowsInlineMediaPlayback
                        mediaPlaybackRequiresUserAction={false}
                        injectedJavaScript={`
							window.open = () => null;
							window.alert = () => null;
							window.confirm = () => null;
							window.prompt = () => null;
							document.addEventListener('contextmenu', e => e.preventDefault());
							document.addEventListener('click', (e) => {
								const a = e.target.closest('a');
								if (a) e.preventDefault();
							}, true);
							document.addEventListener('fullscreenchange', () => {
								const isFullscreen = !!document.fullscreenElement;
								window.ReactNativeWebView?.postMessage(JSON.stringify({ fullscreen: isFullscreen }));
							});
							true;
						`}
                        onMessage={handleMessage}
                        onShouldStartLoadWithRequest={handleRequest}
                        onError={handleWebViewError}
                        javaScriptCanOpenWindowsAutomatically={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default MovieWatchPlayer;
