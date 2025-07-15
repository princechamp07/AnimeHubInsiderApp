import { fetchMoviesByCategory } from '@/api';
import { MovieCard } from '@/components/MovieCard';
import { IAnime } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHUNK_SIZE = 8;

export default function SeeAllMoviesScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const normalizedCategory = (category ?? '').toLowerCase().trim();

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [allFetchedMovies, setAllFetchedMovies] = useState<IAnime[]>([]);
    const [visibleMovies, setVisibleMovies] = useState<IAnime[]>([]);
    const [loading, setLoading] = useState(true);

    const { bottom: bottomInset } = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const bgColor = isDark ? '#000' : '#fff';
    const textColor = isDark ? '#fff' : '#1f2937';
    const borderColor = isDark ? '#333' : '#ccc';
    const buttonBg = isDark ? '#1f2937' : '#e5e7eb';
    const buttonDisabledBg = isDark ? '#4b5563' : '#d1d5db';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { results, totalPages } = await fetchMoviesByCategory(normalizedCategory, page);
                setAllFetchedMovies(results || []);
                setVisibleMovies(results.slice(0, CHUNK_SIZE));
                setTotalPages(totalPages || 1);
            } catch (err) {
                console.error('❌ Error loading movies:', err);
                setAllFetchedMovies([]);
                setVisibleMovies([]);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [normalizedCategory, page]);

    const handleLazyLoad = () => {
        if (visibleMovies.length >= allFetchedMovies.length) return;

        const nextChunk = allFetchedMovies.slice(
            visibleMovies.length,
            visibleMovies.length + CHUNK_SIZE
        );

        setVisibleMovies((prev) => [...prev, ...nextChunk]);
    };

    const Pagination = () => (
        <View
            style={{
                backgroundColor: bgColor,
                borderTopWidth: 1,
                borderColor,
                paddingTop: 12,
                paddingBottom: bottomInset + 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
            }}
        >
            <TouchableOpacity
                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                style={{
                    backgroundColor: page === 1 ? buttonDisabledBg : buttonBg,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                }}
            >
                <Text style={{ color: textColor }}>Prev</Text>
            </TouchableOpacity>

            <Text style={{ color: textColor, fontWeight: '600' }}>
                Page {page} of {totalPages}
            </Text>

            <TouchableOpacity
                onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                style={{
                    backgroundColor: page === totalPages ? buttonDisabledBg : buttonBg,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                }}
            >
                <Text style={{ color: textColor }}>Next</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <Text
                    style={{
                        color: textColor,
                        fontSize: 20,
                        fontWeight: 'bold',
                        textTransform: 'capitalize',
                        marginBottom: 16,
                    }}
                >
                    {normalizedCategory || 'Movies'}
                </Text>
            </View>

            {loading && page === 1 ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 100 }} />
            ) : (
                <FlatList
                    data={visibleMovies}
                    numColumns={2}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) =>
                        item?.coverImage ? (
                            <View className="w-1/2 p-2">
                                <MovieCard anime={item} />
                            </View>
                        ) : null
                    }
                    onEndReached={handleLazyLoad}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        <>
                            {visibleMovies.length < allFetchedMovies.length && (
                                <ActivityIndicator color="#10B981" style={{ marginVertical: 10 }} />
                            )}
                            <Pagination />
                        </>
                    }
                    contentContainerStyle={{
                        paddingBottom: bottomInset + 100,
                        paddingTop: 0,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
