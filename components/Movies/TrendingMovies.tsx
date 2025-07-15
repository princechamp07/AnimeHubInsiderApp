import { IAnime, fetchTrendingMovies } from '@/api';
import { filterUniqueMovies } from '@/utils/deduplicate';
import React from 'react';
import { Text, View } from 'react-native';
import { MovieCardList } from '../MovieCardList';
import { AppSpinner } from '../Spinner';

export function TrendingMovies({ usedIds }: { usedIds: Set<number> }) {
    const [movies, setMovies] = React.useState<IAnime[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const load = async () => {
            try {
                const { results } = await fetchTrendingMovies(1); // Load only page 1
                const unique = filterUniqueMovies(results, usedIds);
                setMovies(unique.slice(0, 10)); // Limit to 10
            } catch (err) {
                console.error('❌ Trending movies error:', err);
                setError('Failed to load trending movies.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <AppSpinner size="large" color="#00ff00" />;
    if (error) return <Text className="text-red-500 px-4">{error}</Text>;
    if (!movies.length) return <Text className="text-white px-4">No trending movies found.</Text>;

    return (
        <View className="px-4">
            <MovieCardList title="Trending Now 🔥" animes={movies} />
        </View>
    );
}
