import { IAnime } from '@/api/types';
import { useRouter } from 'expo-router';
import React from 'react';
import {
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	useColorScheme,
} from 'react-native';
import { MovieCard } from './MovieCard';

export function MovieCardList({
	title,
	actionTitle = 'See all',
	animes,
}: Readonly<{
	title: string;
	actionTitle?: string;
	animes: IAnime[];
}>) {
	const router = useRouter();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';

	const textColor = isDark ? '#FFFFFF' : '#1F2937'; // white or gray-800

	const handleSeeAll = () => {
		const normalizedCategory = title.toLowerCase().split(' ')[0]; // e.g. "Trending Now" → "trending"
		router.push({
			pathname: '/see-all',
			params: { category: normalizedCategory },
		});
	};

	return (
		<View>
			<View className="flex-row items-center justify-between py-4">
				<Text
					style={{ color: textColor }}
					className="text-lg font-semibold"
				>
					{title}
				</Text>
				<TouchableOpacity onPress={handleSeeAll}>
					<Text className="text-green-500 font-semibold">
						{actionTitle}
					</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className="rounded-xl"
			>
				{animes.map((anime, index) => (
					<View key={index} className="mr-3">
						<MovieCard anime={anime} />
					</View>
				))}
			</ScrollView>
		</View>
	);
}
