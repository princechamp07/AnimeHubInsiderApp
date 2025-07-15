import { fetchBollywoodMovies, IAnime } from '@/api';
import { filterUniqueMovies } from '@/utils/deduplicate';
import React from 'react';
import { Text, View } from 'react-native';
import { MovieCardList } from '../MovieCardList';
import { AppSpinner } from '../Spinner';

export function BollywoodMovies({ usedIds }: { usedIds: Set<number> }) {
    const [movies, setMovies] = React.useState<IAnime[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadMovies = async () => {
            try {
                setIsLoading(true);

                // ✅ Destructure results from the response
                const { results } = await fetchBollywoodMovies();

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
                console.error('❌ Failed to fetch Bollywood movies:', err);
                setError('Failed to load Bollywood movies. Please try again.');
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
    }, []);

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
                <Text className="text-white">No Bollywood movies found.</Text>
            </View>
        );
    }

    return (
        <View className="px-4">
            <MovieCardList
                title="Bollywood 🌟"
                actionTitle="See All"
                animes={movies}
            />
        </View>
    );
}
