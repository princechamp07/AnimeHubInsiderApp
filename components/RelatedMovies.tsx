// components/RelatedMovies.tsx
import { fetchRelatedMovies, IAnime } from '@/api';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { MovieCardList } from './MovieCardList';
import { AppSpinner } from './Spinner';

export default function RelatedMovies({ movieId }: { movieId: number }) {
    const [related, setRelated] = useState<IAnime[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!movieId) return;

        setLoading(true);

        fetchRelatedMovies(movieId)
            .then((res) => {
                console.log(
                    '🎬 Related Movies:',
                    res.map((m) => ({
                        movieId: m.id,
                        imdbId: m.imdbId,
                    }))
                );
                setRelated(res);
            })
            .catch((err) => {
                console.error('❌ Failed to fetch related movies:', err);
                setRelated([]);
            })
            .finally(() => setLoading(false));
    }, [movieId]);

    if (loading) {
        return <AppSpinner size="small" color="#10B981" />;
    }

    if (!related.length) {
        return (
            <View className="px-4">
                <Text className="text-white">No related movies found.</Text>
            </View>
        );
    }

    return (
        <View className="px-4 mt-4">
            <MovieCardList title="Related Movies 🎬" animes={related} />
        </View>
    );
}
