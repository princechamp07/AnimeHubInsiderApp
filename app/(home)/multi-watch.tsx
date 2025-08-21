import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

type ServerMap = {
    [serverName: string]: Episode[];
};

type Episode = {
    name: string;
    servers: {
        label: string;
        url: string;
    }[];
};

export default function MultiWatch() {
    const { id: postId, slug } = useLocalSearchParams();
    const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState<number>(0);
    const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);


    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [displayedEpisodes, setDisplayedEpisodes] = useState<Episode[]>([]);
    const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
    const [iframeHTML, setIframeHTML] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // NEW: Server type selection state
    const [serverType, setServerType] = useState<'default' | '480p' | '720p' | '1080p'>('default');
    const [defaultAvailable, setDefaultAvailable] = useState(true);

    const webviewRef = useRef(null);
    const RANGE_SIZE = 25;

    useEffect(() => {
        if (!postId || serverType !== 'default') return; // Only fetch on default mode

        const fetchPostEpisodes = async () => {
            try {
                const { data: post } = await axios.get(
                    `https://toonhub4u.me/wp-json/wp/v2/posts/${postId}`
                );

                const content = post.content?.rendered || '';
                const watchUrlMatch = content.match(/WatchOnline.*?href="([^"]+)"/i);
                if (!watchUrlMatch) {
                    console.warn('⚠️ No WatchOnline URL found.');
                    setDefaultAvailable(false);
                    setServerType('480p'); // Auto-switch
                    return;
                }

                const watchUrl = watchUrlMatch[1];
                const { data: watchHTML } = await axios.get(watchUrl);

                const episodeRegex = /<li>[\s\S]*?<h2[^>]*>(.*?)<\/h2>[\s\S]*?<a href="([^"]+)" class="lnk-blk"><\/a>[\s\S]*?<\/li>/g;

                const episodes: Episode[] = [];
                let match;
                while ((match = episodeRegex.exec(watchHTML)) !== null) {
                    const title = match[1].trim();
                    const epUrl = match[2].trim();

                    const { data: episodeHTML } = await axios.get(epUrl);
                    const iframeRegex = /<div id="options-(\d+)"[\s\S]*?<iframe[^>]+data-src="([^"]+)"/g;
                    const labelRegex = /<a class="btn[^"]*" href="#options-(\d+)">[\s\S]*?<span class="server">\s*(.*?)\s*<\/span>/g;

                    const serverList: { label: string; url: string }[] = [];
                    const idToLabel: { [key: string]: string } = {};

                    let labelMatch;
                    while ((labelMatch = labelRegex.exec(episodeHTML)) !== null) {
                        idToLabel[labelMatch[1]] = labelMatch[2].replace(/\s+/g, ' ').trim();
                    }

                    let iframeMatch;
                    while ((iframeMatch = iframeRegex.exec(episodeHTML)) !== null) {
                        const id = iframeMatch[1];
                        const url = iframeMatch[2].replace(/&amp;/g, '&');
                        const label = idToLabel[id] || `Server ${parseInt(id) + 1}`;
                        serverList.push({ label, url });
                    }

                    episodes.push({ name: title, servers: serverList });
                }

                if (!episodes.length) {
                    console.warn('⚠️ No episodes found.');
                    setDefaultAvailable(false);
                    setServerType('480p'); // Auto-switch
                    return;
                }

                setDefaultAvailable(true);
                setEpisodes(episodes);
                setDisplayedEpisodes(episodes.slice(0, RANGE_SIZE));
                setSelectedRangeIndex(0);

                if (episodes[0]?.servers?.[0]) {
                    handleServerPlay(episodes[0].servers[0].url);
                }
            } catch (err) {
                console.error('❌ Failed to fetch episodes or servers:', err);
                setDefaultAvailable(false);
                setServerType('480p'); // Auto-switch
            }
        };

        fetchPostEpisodes();
    }, [postId, serverType]);

    // Handle range selection: slice episodes accordingly and reset episode & server indexes
    const handleRangeSelect = (rangeIndex: number) => {
        const start = rangeIndex * RANGE_SIZE;
        const end = start + RANGE_SIZE;
        const slicedEpisodes = episodes.slice(start, end);
        setSelectedRangeIndex(rangeIndex);
        setDisplayedEpisodes(slicedEpisodes);

        // Reset selection to first episode in new range
        setSelectedEpisodeIndex(0);
        setSelectedServerIndex(0);

        // Auto-play first server of first episode in new range, if exists
        if (slicedEpisodes.length > 0 && slicedEpisodes[0].servers.length > 0) {
            handleServerPlay(slicedEpisodes[0].servers[0].url);
        }
    };

    // Setup iframe HTML to load server URL
    const handleServerPlay = async (serverUrl: string) => {
        try {
            setLoading(true);

            const { data } = await axios.get(serverUrl);
            const iframeMatch = data.match(/<iframe[^>]+src="([^"]+)"[^>]*>/);

            const finalUrl = iframeMatch?.[1] || serverUrl;

            const htmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body, html {
        margin: 0;
        padding: 0;
        background: black;
        height: 100%;
        overflow: hidden;
      }
      iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
      /* 🚫 Hide overlays, popups, banners, ads */
      .ads, .ad, .overlay, .popup, [id*="ad"], [class*="ad"], [id*="overlay"], [class*="overlay"] {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <iframe src="${finalUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe>
    <script>
      // remove dynamically injected overlays after load
      const observer = new MutationObserver(() => {
        document.querySelectorAll('.ads, .ad, .overlay, .popup, [id*="ad"], [class*="ad"], [id*="overlay"], [class*="overlay"]').forEach(el => el.remove());
      });
      observer.observe(document.body, { childList: true, subtree: true });
    </script>
  </body>
</html>`;


            setIframeHTML(htmlTemplate);
        } catch (err) {
            console.error("❌ Failed to load iframe from server:", err);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };


    const customUserAgent =
        'Mozilla/5.0 (AnimeHubApp) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36';

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

    // Create episode ranges, e.g. ["1-25", "26-50", ...]
    const episodeRanges = Array.from(
        { length: Math.ceil(episodes.length / RANGE_SIZE) },
        (_, i) => {
            const start = i * RANGE_SIZE + 1;
            const end = Math.min((i + 1) * RANGE_SIZE, episodes.length);
            return `${start}-${end}`;
        }
    );

    // 480p Server Logic
    useEffect(() => {
        if (!postId || serverType !== '480p') return;

        const fetch480pEpisodes = async () => {
            try {
                const { data: post } = await axios.get(
                    `https://toonhub4u.me/wp-json/wp/v2/posts/${postId}`
                );

                const content = post.content?.rendered || '';

                // Regex to extract all episodes with 480p links
                const episodeRegex = /Episode\s*:?[\s]*(\d+)[\s\S]*?(?:480p|480P)[\s\S]*?<a[^>]*href="([^"]+)"/gi;

                const episodes: Episode[] = [];
                let match;
                while ((match = episodeRegex.exec(content)) !== null) {
                    const episodeNumber = match[1];
                    const link = match[2];

                    episodes.push({
                        name: `Episode ${episodeNumber}`,
                        servers: [{ label: '480p', url: link }],
                    });
                }

                if (!episodes.length) {
                    console.warn('⚠️ No 480p episodes found.');
                    return;
                }

                setEpisodes(episodes);
                setDisplayedEpisodes(episodes.slice(0, RANGE_SIZE));
                setSelectedRangeIndex(0);

                // Auto-fetch servers for first episode and play it
                fetchEpisodeServers(
                    0, // first episode
                    episodes,
                    setEpisodes,
                    setDisplayedEpisodes,
                    0, // first page range
                    RANGE_SIZE
                );
            } catch (err) {
                console.error('❌ Failed to fetch 480p episodes:', err);
            }
        };

        fetch480pEpisodes();
    }, [postId, serverType]);



    const fetchEpisodeServers = async (
        epIndex: number,
        episodes: EpisodeType[],
        setEpisodes: Function,
        setDisplayedEpisodes: Function,
        selectedRangeIndex: number,
        RANGE_SIZE: number
    ) => {
        try {
            const episodeUrl = episodes[epIndex].servers[0]?.url;
            if (!episodeUrl) return;

            const { data: episodePage } = await axios.get(episodeUrl);

            const serverRegex =
                /<tr>[\s\S]*?<img[^>]+alt="([^"]+)"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>Click<\/a>[\s\S]*?<\/tr>/gi;

            const servers: { label: string; url: string }[] = [];
            let match;
            while ((match = serverRegex.exec(episodePage)) !== null) {
                servers.push({
                    label: match[1].trim(),
                    url: match[2].trim()
                });
            }

            if (servers.length > 0) {
                const updatedEpisodes = [...episodes];
                updatedEpisodes[epIndex] = {
                    ...updatedEpisodes[epIndex],
                    servers
                };
                setEpisodes(updatedEpisodes);
                setDisplayedEpisodes(
                    updatedEpisodes.slice(
                        selectedRangeIndex * RANGE_SIZE,
                        (selectedRangeIndex + 1) * RANGE_SIZE
                    )
                );

                // Automatically play the first server (prevents needing to re-click)
                handleServerPlay(servers[0].url);
            }

        } catch (err) {
            console.error("❌ Failed to fetch episode servers dynamically:", err);
        }
    };



    const serverTypes = ['default', '480p', '720p', '1080p'] as const;

    return (
        <ScrollView className="flex-1 px-4 pt-1 bg-black">
            <View className="h-72 w-full bg-black overflow-hidden mb-6">
                {loading ? (
                    <ActivityIndicator size="large" color="#00f" className="mt-10" />
                ) : (
                    iframeHTML && (
                        <WebView
                            ref={webviewRef}
                            originWhitelist={['*']}
                            source={{ html: iframeHTML }}
                            userAgent={customUserAgent}
                            javaScriptEnabled
                            domStorageEnabled
                            mediaPlaybackRequiresUserAction={false}
                            allowsFullscreenVideo
                            allowsInlineMediaPlayback
                            
                            injectedJavaScript={`
                                // Hide the fake overlay
                                const overlay = document.querySelector('.fake-player-overlay');
                                if (overlay) overlay.remove();
                                
                                // Block redirect function
                                window.redirectToAd = () => {};
                                true; // <- required to avoid WebView crash
                              `}
                            onMessage={handleMessage}
                        />
                    )
                )}
            </View>

            <Text className="text-white text-xl font-bold mb-4 text-center">
                {'Now Watching'}
            </Text>

            {/* Server Buttons */}
            <Text className="text-lg font-semibold text-white mb-2">Select Server</Text>
            <View className="flex-row flex-wrap mb-4">
                {displayedEpisodes[selectedEpisodeIndex]?.servers?.map((server, idx) => (
                    <TouchableOpacity
                        key={idx}
                        onPress={() => {
                            setSelectedServerIndex(idx);
                            handleServerPlay(server.url);
                        }}
                        className={`px-4 py-2 mr-2 mb-2 rounded-full ${selectedServerIndex === idx ? 'bg-green-600' : 'bg-gray-800'
                            }`}
                    >
                        <Text className="text-white">{`HD ${idx + 1}`}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* NEW: Server Type Buttons */}
            <Text className="text-lg font-semibold text-white mb-2">Server Type</Text>
            <View className="flex-row flex-wrap mb-4">
                {serverTypes.map((type) => (
                    <TouchableOpacity
                        key={type}
                        disabled={type === 'default' && !defaultAvailable}
                        onPress={() => setServerType(type)}
                        className={`px-4 py-2 mr-2 mb-2 rounded-full ${serverType === type
                            ? 'bg-green-600'
                            : (type === 'default' && !defaultAvailable)
                                ? 'bg-gray-500'
                                : 'bg-gray-800'
                            }`}
                    >
                        <Text className="text-white capitalize">{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Episode Range Selector */}
            {episodes.length > RANGE_SIZE && (
                <>
                    <Text className="text-lg font-semibold text-white mb-2">Select Range</Text>
                    <View className="flex-row flex-wrap mb-4">
                        {episodeRanges.map((range, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleRangeSelect(index)}
                                className={`px-4 py-2 mr-2 mb-2 rounded-full ${selectedRangeIndex === index ? 'bg-green-600' : 'bg-gray-700'
                                    }`}
                            >
                                <Text className="text-white font-medium">{range}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {/* Episode Buttons */}
            <Text className="text-lg font-semibold text-white mb-2">Episodes</Text>
            <View className="flex-row flex-wrap mb-4">
                {displayedEpisodes.map((ep, epIndex) => {
                    const absoluteEpisodeNumber =
                        selectedRangeIndex * RANGE_SIZE + epIndex + 1;

                    return (
                        <TouchableOpacity
                            key={epIndex}
                            onPress={async () => {
                                setSelectedEpisodeIndex(epIndex);
                                setSelectedServerIndex(0);

                                const firstServer = displayedEpisodes[epIndex].servers[0];
                                if (firstServer) handleServerPlay(firstServer.url);

                                await fetchEpisodeServers(
                                    epIndex,
                                    episodes,
                                    setEpisodes,
                                    setDisplayedEpisodes,
                                    selectedRangeIndex,
                                    RANGE_SIZE,
                                    handleServerPlay
                                );
                            }}
                            className={`w-16 h-10 justify-center items-center mr-2 mb-2 rounded-full ${selectedEpisodeIndex === epIndex
                                ? "bg-purple-600"
                                : "bg-gray-700"
                                }`}
                        >
                            <Text className="text-white text-sm font-medium">{`Ep ${absoluteEpisodeNumber}`}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>



        </ScrollView>
    );
}
