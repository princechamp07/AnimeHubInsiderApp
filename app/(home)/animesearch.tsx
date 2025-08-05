import { ActionAdventureAnime, searchAnimes } from '@/api';
import { MultiAnimeCard } from '@/components/MultiAnimeCard';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Text,
    View,
    useColorScheme,
} from 'react-native';

export default function AnimeSearch() {
    const { q } = useLocalSearchParams();
    const [results, setResults] = useState<ActionAdventureAnime[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useColorScheme();
    const isDark = theme === 'dark';

    const backgroundColor = isDark ? '#000000' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#1f2937'; // gray-800
    const subTextColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 / gray-500

    useEffect(() => {
        if (!q || typeof q !== 'string') return;

        const fetchResults = async () => {
            try {
                setLoading(true);
                const data = await searchAnimes(q);
                setResults(data);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [q]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View className="flex-1 px-4 pt-4" style={{ backgroundColor }}>
            <Text
                style={{ color: textColor }}
                className="text-xl font-bold mb-4"
            >
                Search Results for: “{q}”
            </Text>

            {results.length === 0 ? (
                <Text style={{ color: subTextColor }} className="text-base">
                    No results found.
                </Text>
            ) : (
                <FlatList
                    data={results}
                    numColumns={2}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View className="w-1/2 p-1">
                            <MultiAnimeCard anime={item} />
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
