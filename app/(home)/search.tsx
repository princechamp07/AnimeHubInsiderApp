import { fetchRandomAnimeSuggestions, searchAnimeByQuery } from '@/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

type AnimeResult = {
    image: string;
    id: number;
    title: {
        romaji?: string;
        english?: string;
    };
    coverImage: {
        large: string;
    };
    genres?: string[];
};

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AnimeResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<AnimeResult[]>([]);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const router = useRouter();
    const showSuggestions = !query.trim() && results.length === 0 && suggestions.length > 0;

    useEffect(() => {
        const loadSuggestions = async () => {
            const randoms = await fetchRandomAnimeSuggestions();
            setSuggestions(randoms);
        };

        loadSuggestions();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data = await searchAnimeByQuery(query);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnimePress = (anime: AnimeResult) => {
        router.push({
            pathname: '/watch',
            params: {
                id: anime.id.toString(),
                slug: anime.title.romaji ?? anime.title.english ?? 'anime',
            },
        });
    };

    const backgroundColor = isDark ? '#111827' : '#ffffff'; // dark: gray-900, light: white
    const inputColor = isDark ? '#1f2937' : '#f9fafb'; // dark: gray-800, light: gray-50
    const placeholderColor = isDark ? '#9ca3af' : '#6b7280'; // dark: gray-400, light: gray-500
    const textColor = isDark ? '#ffffff' : '#1f2937'; // dark: white, light: gray-800
    const genreColor = isDark ? '#d1d5db' : '#6b7280'; // gray-300 or gray-500

    return (
        <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View className="p-4">
                <TextInput
                    placeholder="Search Anime..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    className="border border-gray-300 dark:border-gray-700 rounded-full px-4 py-3 text-black dark:text-white"
                    style={{
                        backgroundColor: inputColor,
                        color: textColor,
                    }}
                    placeholderTextColor={placeholderColor}
                />
            </View>

            <FlatList
                data={showSuggestions ? suggestions : results}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    query === '' && suggestions.length > 0 ? (
                        <Text
                            style={{ color: textColor }}
                            className="text-lg font-semibold px-4 pb-2 mt-2"
                        >
                            Suggested Anime ✨
                        </Text>
                    ) : null
                }
                ListEmptyComponent={
                    !loading && query !== '' && (
                        <Text className="text-center text-gray-500 mt-5">
                            No results found.
                        </Text>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="flex-row items-center rounded-xl shadow-md p-3 mx-4 mb-4"
                        style={{ backgroundColor: inputColor }}
                        onPress={() => handleAnimePress(item)}
                        activeOpacity={0.85}
                    >
                        <Image
                            source={{
                                uri: item.image || 'https://via.placeholder.com/120x160.png?text=No+Image',
                            }}
                            style={{
                                width: 80,
                                height: 120,
                                borderRadius: 10,
                                marginRight: 12,
                            }}
                            resizeMode="cover"
                        />

                        <View className="flex-1">
                            <Text
                                style={{ color: textColor }}
                                className="text-lg font-semibold"
                                numberOfLines={1}
                            >
                                {item.title.romaji ?? item.title.english}
                            </Text>
                            <Text
                                style={{ color: genreColor }}
                                className="text-sm mt-1"
                                numberOfLines={2}
                            >
                                {item.genres?.join(', ') || 'No genres'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </KeyboardAvoidingView>
    );
}
