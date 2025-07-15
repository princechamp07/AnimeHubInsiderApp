import { IAnime, fetchAllMovies } from '@/api';
import React from 'react';
import { Text, View } from 'react-native';
import { MovieCardList } from '../MovieCardList';
import { AppSpinner } from '../Spinner';

export function AllMovies({ usedIds }: { usedIds: Set<number> }) {
    const [movies, setMovies] = React.useState<IAnime[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const load = async () => {
            try {
                const { results } = await fetchAllMovies(1); // 👈 fetch only page 1
                setMovies(results.slice(0, 10)); // 👈 show first 10 only
            } catch (err) {
                console.error('❌ All movies error:', err);
                setError('Failed to load all movies.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <AppSpinner size="large" color="#00ff00" />;
    if (error) return <Text className="text-red-500 px-4">{error}</Text>;
    if (!movies.length) return <Text className="text-white px-4">No movies found.</Text>;

    return (
        <View className="px-4">
            <MovieCardList title="All Movies 🎬" animes={movies} />
        </View>
    );
}
