import { fetchMovies, IAnime } from '@/api';
import React from 'react';
import { Text, View } from 'react-native';
import { AnimeCardList } from '../AnimeCardList';
import { AppSpinner } from '../Spinner';

export function MovieAnime({ excludeIds = [] }: { excludeIds?: number[] }) {
    const [animes, setAnimes] = React.useState<IAnime[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadMovies = async () => {
            try {
                console.log('🎬 Fetching movie anime...');
                setIsLoading(true);

                const data = await fetchMovies();

                if (!data || !Array.isArray(data)) {
                    console.error('❌ Invalid movie data received:', data);
                    throw new Error('Invalid data format');
                }

                const filtered = data.filter(
                    (anime: IAnime) =>
                        anime &&
                        anime.id &&
                        anime.coverImage?.large &&
                        !excludeIds.includes(anime.id)
                );

                setAnimes(filtered);
            } catch (err) {
                console.error('❌ Failed to fetch movie anime:', err);
                setError('Failed to load movie anime. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadMovies();

        return () => {
            setAnimes([]);
            setIsLoading(false);
            setError(null);
        };
    }, [excludeIds]);

    if (isLoading) {
        return <AppSpinner size="large" color="#6366F1" />;
    }

    if (error) {
        return (
            <View className="px-4 flex-row gap-3">
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!Array.isArray(animes) || animes.length === 0) {
        return (
            <View className="px-4 flex-row gap-3">
                <Text className="text-white">No movie anime found.</Text>
            </View>
        );
    }

    return (
        <View className="px-4 flex-row gap-3">
            <AnimeCardList title="Movies 🎥" actionTitle="See all" animes={animes} />
        </View>
    );
}
