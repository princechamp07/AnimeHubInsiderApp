import { fetchHollywoodMovies, IAnime } from '@/api';
import { filterUniqueMovies } from '@/utils/deduplicate';
import React from 'react';
import { Text, View } from 'react-native';
import { MovieCardList } from '../MovieCardList';
import { AppSpinner } from '../Spinner';

export function HollywoodMovies({ usedIds }: { usedIds: Set<number> }) {
    const [movies, setMovies] = React.useState<IAnime[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadMovies = async () => {
            try {
                setIsLoading(true);

                // ✅ Destructure from new API response
                const { results } = await fetchHollywoodMovies();

                if (Array.isArray(results)) {
                    const filtered = results.filter(
                        (movie) => movie && movie.coverImage && movie.coverImage.large
                    );
                    const unique = filterUniqueMovies(filtered, usedIds);
                    setMovies(unique.slice(0, 10)); // ✅ Limit to 10 movies
                } else {
                    setMovies([]);
                }
            } catch (err) {
                console.error('❌ Failed to fetch Hollywood movies:', err);
                setError('Failed to load Hollywood movies. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadMovies();

        return () => {
            setMovies([]);
            setIsLoading(false);
            setError(null);
        };
    }, [usedIds]);

    if (isLoading) {
        return <AppSpinner size="large" color="#FF0000" />;
    }

    if (error) {
        return (
            <View className="px-4">
                <Text className="text-red-500">{error}</Text>
            </View>
        );
    }

    if (!movies || movies.length === 0) {
        return (
            <View className="px-4">
                <Text className="text-white">No Hollywood movies found.</Text>
            </View>
        );
    }

    return (
        <View className="px-4">
            <MovieCardList
                title="Hollywood 🎥"
                actionTitle="See All"
                animes={movies}
            />
        </View>
    );
}
