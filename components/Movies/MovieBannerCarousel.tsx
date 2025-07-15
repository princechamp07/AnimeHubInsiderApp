import { fetchHollywoodMovies } from '@/api';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Pressable,
    SafeAreaView,
    Text,
    View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

type BannerMovie = {
    id: number;
    imdbId: string; // ✅ Added
    title: { romaji?: string; english?: string };
    genres: string[];
    image: string;
};

export function MovieBannerCarousel() {
    const [banners, setBanners] = useState<BannerMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            try {
                const { results } = await fetchHollywoodMovies(1);

                const topMovies = results.slice(0, 10).map((movie) => ({
                    id: movie?.id ?? 0,
                    imdbId: movie?.imdbId ?? '', // ✅ Added
                    title: movie?.title ?? { romaji: 'Untitled' },
                    genres: Array.isArray(movie?.genres) ? movie.genres : [],
                    image: movie?.coverImage?.large || 'https://placehold.co/600x300?text=No+Image',
                }));

                if (topMovies.length === 0) {
                    topMovies.push({
                        id: 9999,
                        imdbId: 'tt0000000', // demo fallback
                        title: { romaji: 'Demo Movie' },
                        genres: ['Drama', 'Action'],
                        image: 'https://placehold.co/600x300?text=Demo+Movie',
                    });
                }

                setBanners(topMovies);
            } catch (err) {
                console.error('❌ Failed to fetch movie banners:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleNavigate = (movie: BannerMovie) => {
        console.log('🎬 Clicked Movie ID:', movie.id);
        console.log('🎥 IMDb ID:', movie.imdbId);
        console.log('📛 Slug:', movie.title.romaji ?? movie.title.english ?? 'movie');

        router.push({
            pathname: '/movie-watch',
            params: {
                id: movie.id.toString(),
                imdbId: movie.imdbId,
                slug: movie.title.romaji ?? movie.title.english ?? 'movie',
            },
        });
    };

    if (loading) {
        return (
            <View className="items-center justify-center h-[300px]">
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    if (!banners.length) {
        return (
            <View className="items-center justify-center h-[300px] bg-gray-100">
                <Text className="text-gray-500 text-lg">No movie banners available.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView>
            <View>
                <Carousel
                    loop
                    width={width}
                    height={260}
                    autoPlay
                    data={banners}
                    scrollAnimationDuration={3000}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => handleNavigate(item)}>
                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 600 }}
                                className="relative"
                            >
                                <Image
                                    source={{ uri: item.image }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />

                                <View className="absolute bottom-5 left-5 right-5">
                                    <Text className="text-white text-lg font-semibold" numberOfLines={1}>
                                        {item.title.romaji ?? item.title.english}
                                    </Text>
                                    <Text className="text-white text-xs mt-1" numberOfLines={1}>
                                        {Array.isArray(item.genres) && item.genres.length > 0
                                            ? item.genres.join(', ')
                                            : 'No genres'}
                                    </Text>

                                    <View className="flex-row mt-3 space-x-3 gap-2">
                                        <Pressable
                                            onPress={() => handleNavigate(item)}
                                            className="bg-green-500 px-5 py-1.5 rounded-full"
                                        >
                                            <Text className="text-white font-semibold">▶ Play</Text>
                                        </Pressable>
                                        <Pressable className="border border-white px-5 py-1.5 rounded-full">
                                            <Text className="text-white font-semibold">＋ My List</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </MotiView>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
