import { ActionAdventureAnime, fetchAmazonPrime } from '@/api';
import React from 'react';
import { Text, View } from 'react-native';
import { MultiAnimeCardList } from '../MultiAnimeCardList';
import { AppSpinner } from '../Spinner';

export function AmazonPrime() {
    const [animes, setAnimes] = React.useState<ActionAdventureAnime[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadActionAdventure = async () => {
            try {

                console.log('Fetching Amazon Prime series...');

                setIsLoading(true);
                const data = await fetchAmazonPrime();
                console.log('Amazon Prime fetched:', data);
                if (data && Array.isArray(data)) {
                    setAnimes(data);
                }
            } catch (err) {
                console.error('Failed to fetch ongoing series:', err);
                setError('Failed to load ongoing series. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadActionAdventure();
        return () => {
            setAnimes([]);
            setIsLoading(false);
            setError(null);
        };
    }, []);

    if (isLoading) {
        return (
            <AppSpinner
                size='large'
                color='#FF0000'
            />
        );
    }

    if (error) {
        return (
            <View className='px-4 flex-row gap-3'>
                <Text style={{ color: 'red' }}>
                    Failed to load anime. Please try again later.
                </Text>
            </View>
        );
    }

    if (!animes || animes?.length === 0) {
        return (
            <View className='px-4 flex-row gap-3'>
                <Text>No Amazon Prime series found.</Text>
            </View>
        );
    }

    return (
        <View className='px-4 flex-row gap-3'>
            <MultiAnimeCardList
                title='Amazon Prime 🌟'
                actionTitle='See all'
                animes={animes}
            />
        </View>
    );
}
