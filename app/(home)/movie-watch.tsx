import MovieWatchPlayer from '@/components/MovieWatchPlayer';
import RelatedMovies from '@/components/RelatedMovies';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function MovieWatch() {
    const { id, imdbId } = useLocalSearchParams();
    const movieId = parseInt(id as string, 10);
    const imdbIdStr = imdbId as string;

    const [activeServer, setActiveServer] = useState<'vidsrc-cc' | 'vidsrc-icu' | 'vidsrc-pk'>('vidsrc-cc');

    const servers: { key: 'vidsrc-cc' | 'vidsrc-icu' | 'vidsrc-pk'; label: string }[] = [
        { key: 'vidsrc-cc', label: 'HD1' },
        { key: 'vidsrc-icu', label: 'HD2' },
        { key: 'vidsrc-pk', label: 'HD3' },
    ];

    // Force re-render on server switch
    const [playerKey, setPlayerKey] = useState(0);

    const handleServerChange = (key: typeof activeServer) => {
        setActiveServer(key);
        setPlayerKey(prev => prev + 1);
    };

    return (
        <SafeAreaView className="dark:bg-gray-900 bg-white flex-1">
            {!isNaN(movieId) && imdbIdStr && (
                <>
                    {/* Video Player */}
                    <MovieWatchPlayer
                        key={playerKey}
                        movieId={movieId.toString()}
                        ImdbId={imdbIdStr}
                        activeServer={activeServer}
                    />

                    {/* Info note */}
                    <Text className="text-center text-sm mt-2 text-gray-500 dark:text-gray-300">
                        If this server doesn’t work, try switching to another below:
                    </Text>

                    {/* Server Switch Buttons */}
                    <View className="flex-row justify-center gap-4 py-4">
                        {servers.map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => handleServerChange(key)}
                                className={`px-4 py-2 rounded-full ${activeServer === key ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                            >
                                <Text
                                    className={`${activeServer === key ? 'text-white' : 'text-black dark:text-white'
                                        } font-semibold`}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Related Movies */}
                    <RelatedMovies movieId={movieId} />
                </>
            )}
        </SafeAreaView>
    );
}
