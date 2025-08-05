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
    const webviewRef = useRef(null);


    // Default range chunk size
    const RANGE_SIZE = 25;

    useEffect(() => {
        if (!postId) return;

        const fetchPostEpisodes = async () => {
            try {
                const { data: post } = await axios.get(
                    `https://toonhub4u.me/wp-json/wp/v2/posts/${postId}`
                );

                const content = post.content?.rendered || '';

                // Extract WatchOnline URL
                const watchUrlMatch = content.match(/WatchOnline.*?href="([^"]+)"/i);
                if (!watchUrlMatch) {
                    console.warn('⚠️ No WatchOnline URL found.');
                    return;
                }

                const watchUrl = watchUrlMatch[1];

                // Fetch the HTML from Watch page
                const { data: watchHTML } = await axios.get(watchUrl);

                // Extract episodes from <li> blocks
                const episodeRegex = /<li>[\s\S]*?<h2[^>]*>(.*?)<\/h2>[\s\S]*?<a href="([^"]+)" class="lnk-blk"><\/a>[\s\S]*?<\/li>/g;

                const episodes: Episode[] = [];
                let match;

                while ((match = episodeRegex.exec(watchHTML)) !== null) {
                    const title = match[1].trim();
                    const epUrl = match[2].trim();

                    // Fetch the individual episode page
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
                    return;
                }

                // Store in state and initiate first range display & playing
                setEpisodes(episodes);
                setDisplayedEpisodes(episodes.slice(0, RANGE_SIZE));
                setSelectedRangeIndex(0);

                // Auto-play first episode, first server
                if (episodes[0]?.servers?.[0]) {
                    handleServerPlay(episodes[0].servers[0].url);
                }
            } catch (err) {
                console.error('❌ Failed to fetch episodes or servers:', err);
            }
        };

        fetchPostEpisodes();
    }, [postId]);

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
    const handleServerPlay = (url: string) => {
        setLoading(true);
        const htmlTemplate = `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body,html{margin:0;padding:0;background:black;height:100%}iframe{width:100%;height:100%;border:none}</style>
    </head><body>
    <iframe src="${url}" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </body></html>`;
        setIframeHTML(htmlTemplate);
        setTimeout(() => setLoading(false), 500);
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
                    const absoluteEpisodeNumber = selectedRangeIndex * RANGE_SIZE + epIndex + 1;
                    return (
                        <TouchableOpacity
                            key={epIndex}
                            onPress={() => {
                                setSelectedEpisodeIndex(epIndex);
                                setSelectedServerIndex(0);
                                const firstServer = displayedEpisodes[epIndex].servers[0];
                                if (firstServer) handleServerPlay(firstServer.url);
                            }}
                            className={`w-16 h-10 justify-center items-center mr-2 mb-2 rounded-full ${selectedEpisodeIndex === epIndex ? 'bg-purple-600' : 'bg-gray-700'
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
