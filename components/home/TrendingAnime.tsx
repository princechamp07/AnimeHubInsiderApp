import { fetchTrendingAnime, IAnime } from '@/api';
import React from 'react';
import { Text, View } from 'react-native';
import { AnimeCardList } from '../AnimeCardList';
import { AppSpinner } from '../Spinner';

export function TrendingAnime({
    excludeIds = [],
}: {
    excludeIds?: number[];
}) {
    const [animes, setAnimes] = React.useState<IAnime[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadTrendingAnime = async () => {
            try {
                console.log('📦 Fetching trending anime...');
                setIsLoading(true);

                const data = await fetchTrendingAnime();

                if (data && Array.isArray(data)) {
                    // Filter out anime already in ongoing
                    const filtered = data.filter(
                        (anime: IAnime) => !excludeIds.includes(anime.id)
                    );
                    setAnimes(filtered);
                }
            } catch (err) {
                console.error('❌ Failed to fetch trending anime:', err);
                setError('Failed to load trending anime. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadTrendingAnime();

        return () => {
            setAnimes([]);
            setIsLoading(false);
            setError(null);
        };
    }, [excludeIds]);

    if (isLoading) {
        return <AppSpinner size="large" color="#10B981" />;
    }

    if (error) {
        return (
            <View className="px-4 flex-row gap-3">
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!animes || animes.length === 0) {
        return (
            <View className="px-4 flex-row gap-3">
                <Text>No trending anime found.</Text>
            </View>
        );
    }

    return (
        <View className="px-4 flex-row gap-3">
            <AnimeCardList title="Trending 📈" actionTitle="See all" animes={animes} />
        </View>
    );
}
