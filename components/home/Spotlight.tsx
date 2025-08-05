// Spotlight.tsx
import { fetchSpotlightAnime, SpotlightAnime } from '@/api'; // 👈 import from your api.ts
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export function Spotlight() {
    const [banners, setBanners] = useState<SpotlightAnime[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function getData() {
            const data = await fetchSpotlightAnime();
            setBanners(data);
            setLoading(false);
        }

        getData();
    }, []);

    const handleNavigate = (anime: SpotlightAnime) => {
        router.push({
            pathname: '/multi-watch',
            params: {
                id: anime._id,
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
                <Text className="text-gray-500 text-lg">No spotlight content available.</Text>
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
                            <View className="relative">
                                <Image
                                    source={{ uri: item.cover }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                                <View className="absolute bottom-5 left-5 right-5">
                                    <Text className="text-white text-lg font-semibold" numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text className="text-white text-xs mt-1" numberOfLines={1}>
                                        {item.genre.length ? item.genre.join(', ') : 'Hindi Dubbed'}
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
                            </View>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
