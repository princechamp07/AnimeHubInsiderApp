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
import { AnimeCard } from './AnimeCard';

export function AnimeCardList({
	title,
	actionTitle = 'See all',
	animes,
}: {
	title: string;
	actionTitle?: string;
	animes: IAnime[];
}) {
	const router = useRouter();
	const theme = useColorScheme();

	const isDark = theme === 'dark';

	const handleSeeAll = () => {
		router.push({
			pathname: '/see-all-anime',
			params: { category: title.toLowerCase().split(' ')[0] },
		});
	};

	const textColor = isDark ? '#ffffff' : '#1f2937'; // white or gray-800
	const containerBg = isDark ? '#111827' : '#ffffff'; // gray-900 or white

	return (
		<View style={{ backgroundColor: containerBg }}>
			<View className="flex-row items-center justify-between py-4 px-2">
				<Text
					style={{
						color: textColor,
						fontSize: 18,
						fontWeight: '600',
					}}
				>
					{title}
				</Text>
				<TouchableOpacity onPress={handleSeeAll}>
					<Text style={{ color: '#10B981', fontWeight: '600' }}>{actionTitle}</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className="rounded-xl px-2"
			>
				{animes.map((anime, index) => (
					<View key={index} className="mr-3">
						<AnimeCard anime={anime} />
					</View>
				))}
			</ScrollView>
		</View>
	);
}
