import { IAnime, fetchAnimeByCategory } from '@/api';
import { AnimeCard } from '@/components/AnimeCard';
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

const PER_PAGE = 14;

export default function SeeAllAnimesScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const [allAnimes, setAllAnimes] = useState<IAnime[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const normalizedCategory = (category ?? '').toLowerCase().trim();
    const theme = useColorScheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchAnimeByCategory(normalizedCategory, 1, 50);
                setAllAnimes(data);
                setPage(1);
            } catch (err) {
                console.error('❌ Error loading anime:', err);
                setAllAnimes([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [normalizedCategory]);

    const totalPages = Math.ceil(allAnimes.length / PER_PAGE);
    const paginatedAnimes = allAnimes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const backgroundColor = isDark ? '#000' : '#fff';
    const textColor = isDark ? '#fff' : '#1f2937';
    const buttonActive = isDark ? '#1f2937' : '#e5e7eb';
    const buttonDisabled = isDark ? '#4b5563' : '#d1d5db';

    const renderPagination = () => (
        <View
            style={{
                paddingBottom: insets.bottom + 16,
                paddingTop: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                backgroundColor,
            }}
        >
            <TouchableOpacity
                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                style={{
                    backgroundColor: page === 1 ? buttonDisabled : buttonActive,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                }}
            >
                <Text style={{ color: textColor }}>Prev</Text>
            </TouchableOpacity>

            <Text style={{ color: textColor }}>
                Page {page} of {totalPages}
            </Text>

            <TouchableOpacity
                onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                style={{
                    backgroundColor: page === totalPages ? buttonDisabled : buttonActive,
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
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <View className="px-4 pt-4">
                <Text
                    style={{ color: textColor }}
                    className="text-xl font-bold mb-4 capitalize"
                >
                    See All: {normalizedCategory || 'Popular'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 100 }} />
            ) : (
                <FlatList
                    data={paginatedAnimes}
                    key={'2-columns'}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View className="w-1/2 p-1">
                            <AnimeCard anime={item} />
                        </View>
                    )}
                    ListFooterComponent={renderPagination()}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
