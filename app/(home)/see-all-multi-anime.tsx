import {
    fetchActionAdventure,
    fetchAmazonPrime,
    fetchCartoonShows,
    fetchCrunchyRoll,
    SpotlightAnime
} from '@/api';
import { MultiAnimeCard } from '@/components/MultiAnimeCard';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PER_PAGE = 14;

export default function MultiAnimeSeeAllScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const normalizedCategory = (category ?? '').toLowerCase().trim();

    const [allAnimes, setAllAnimes] = useState<SpotlightAnime[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const theme = useColorScheme();
    const isDark = theme === 'dark';

    const backgroundColor = isDark ? '#000' : '#fff';
    const textColor = isDark ? '#fff' : '#1f2937';
    const buttonActive = isDark ? '#1f2937' : '#e5e7eb';
    const buttonDisabled = isDark ? '#4b5563' : '#d1d5db';

    const loadCategoryData = async () => {
        setLoading(true);
        try {
            let data: SpotlightAnime[] = [];

            switch (normalizedCategory) {
                case 'action':
                    data = await fetchActionAdventure();
                    break;
                case 'amazon':
                    data = await fetchAmazonPrime();
                    break;
                case 'cartoon':
                    data = await fetchCartoonShows();
                    break;
                case 'crunchy':
                    data = await fetchCrunchyRoll();
                    break;
                case 'all':
                    // Optional: fetch multiple & merge
                    const [s, a, am, c] = await Promise.all([
                        fetchActionAdventure(),
                        fetchAmazonPrime(),
                        fetchCartoonShows(),
                        fetchCrunchyRoll(),
                    ]);
                    data = [...s, ...a, ...am, ...c];
                    break;
                default:
                    data = [];
            }

            setAllAnimes(data);
            setPage(1);
        } catch (err) {
            console.error('❌ Failed to fetch category animes:', err);
            setAllAnimes([]);
        } finally {
            setLoading(false);
        }
    };

    console.log('🪪 Category received:', normalizedCategory);

    useEffect(() => {
        loadCategoryData();
    }, [normalizedCategory]);

    const totalPages = Math.ceil(allAnimes.length / PER_PAGE);
    const paginatedAnimes = allAnimes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
                <Text style={{ color: textColor }} className="text-xl font-bold mb-4 capitalize">
                    See All: {normalizedCategory || 'All'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 100 }} />
            ) : (
                <FlatList
                    data={paginatedAnimes}
                    key={'2-columns'}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View className="w-1/2 p-1">
                            <MultiAnimeCard anime={item} />
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
