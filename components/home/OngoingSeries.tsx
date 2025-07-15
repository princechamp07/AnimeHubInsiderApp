import { fetchOngoingSeries, IAnime } from '@/api';
import React from 'react';
import { Text, View } from 'react-native';
import { AnimeCardList } from '../AnimeCardList';
import { AppSpinner } from '../Spinner';

export function OngoingSeries() {
	const [animes, setAnimes] = React.useState<IAnime[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const loadOngoingSeries = async () => {
			try {

				console.log('Fetching ongoing series...');

				setIsLoading(true);
				const data = await fetchOngoingSeries();
				console.log('Ongoing series fetched:', data);
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

		loadOngoingSeries();
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
				<Text>No ongoing series found.</Text>
			</View>
		);
	}

	return (
		<View className='px-4 flex-row gap-3'>
			<AnimeCardList
				title='OnGoing 🔥'
				actionTitle='See all'
				animes={animes}
			/>
		</View>
	);
}
