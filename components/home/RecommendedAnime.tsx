import { fetchRecommendedAnime, IAnime } from '@/api';
import React from 'react';
import { Text, View } from 'react-native';
import { AnimeCardList } from '../AnimeCardList';
import { AppSpinner } from '../Spinner';

export function RecommendedAnime() {
    const [animes, setAnimes] = React.useState<IAnime[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadRecommendedAnime = async () => {
            try {
                console.log('📦 Fetching recommended anime...');
                setIsLoading(true);

                const data = await fetchRecommendedAnime();

                if (!data || !Array.isArray(data)) {
                    console.error('❌ Invalid recommended anime data:', data);
                    throw new Error('Invalid data format');
                }

                const filtered = data.filter(
                    (anime: IAnime) => anime && anime.id && anime.coverImage?.large
                );

                // ✅ Filter out duplicates
                const uniqueMap = new Map<number, IAnime>();
                for (const anime of filtered) {
                    if (!uniqueMap.has(anime.id)) {
                        uniqueMap.set(anime.id, anime);
                    }
                }

                setAnimes(Array.from(uniqueMap.values()));
            } catch (err) {
                console.error('❌ Failed to fetch recommended anime:', err);
                setError('Failed to load recommended anime. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadRecommendedAnime();
    }, []);

    if (isLoading) {
        return <AppSpinner size="large" color="#6366f1" />;
    }

    if (error) {
        return (
            <View className="px-4">
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!Array.isArray(animes) || animes.length === 0) {
        return (
            <View className="px-4">
                <Text className="text-white">No recommended anime found.</Text>
            </View>
        );
    }

    return (
        <View className="px-4">
            <AnimeCardList
                title="Recommended 🌟"
                actionTitle="See All"
                animes={animes}
            />
        </View>
    );
}
