import { AllMovies } from '@/components/Movies/AllMovies';
import { BollywoodMovies } from '@/components/Movies/BollywoodMovies';
import { HollywoodMovies } from '@/components/Movies/HollywoodMovies';
import { MovieBannerCarousel } from '@/components/Movies/MovieBannerCarousel';
import { TrendingMovies } from '@/components/Movies/TrendingMovies';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Keyboard,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Movies() {
    const usedIds = useRef<Set<number>>(new Set());
    const [query, setQuery] = useState('');
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleSearch = () => {
        if (!query.trim()) return;
        Keyboard.dismiss();
        router.push({
            pathname: '/movie-search',
            params: { q: query.trim() },
        });
    };

    return (
        <SafeAreaView className="dark:bg-gray-900 bg-white flex-1">
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 100, // Extra space for footer
                }}
            >
                <View className="p-4">
                    <View className="flex-row items-center">
                        <TextInput
                            placeholder="Search Movie..."
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full px-4 py-3 text-black dark:text-white"
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            onPress={handleSearch}
                            className="ml-2 px-4 py-3 bg-green-600 rounded-full"
                        >
                            <Text className="text-white font-semibold">Go</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <MovieBannerCarousel />
                <BollywoodMovies usedIds={usedIds.current} />
                <HollywoodMovies usedIds={usedIds.current} />
                <TrendingMovies usedIds={usedIds.current} />
                <AllMovies usedIds={usedIds.current} />
            </ScrollView>

            {/* 🛠 Safe footer placement with padding */}

        </SafeAreaView>
    );
}
