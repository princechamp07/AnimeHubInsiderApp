import { fetchOngoingSeries } from '@/api';
import React, { useEffect, useState } from 'react';
import {
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavHeader } from './NavHeader';

// Default Mode Components
import { BannerCarousel } from './BannerCarousel';
import { MovieAnime } from './MovieAnime';
import MultiAnimeHome from './MultiAnimeHome';
import { OngoingSeries } from './OngoingSeries';
import { RecommendedAnime } from './RecommendedAnime';
import { TrendingAnime } from './TrendingAnime';

// Multi-language Components


export const Home = () => {
	const [ongoingIds, setOngoingIds] = useState<number[]>([]);
	const [isMultiLang, setIsMultiLang] = useState<boolean>(false);
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		const loadOngoing = async () => {
			const ongoing = await fetchOngoingSeries();
			const ids = ongoing.map((anime) => anime.id);
			setOngoingIds(ids);
		};
		loadOngoing();
	}, []);

	const bgColor = colorScheme === 'dark' ? '#111827' : '#ffffff';

	return (
		<View className="flex-1 bg-white dark:bg-gray-900">
			<View
				style={{
					paddingTop: insets.top,
					backgroundColor: bgColor,
					paddingHorizontal: 16,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				{/* Switch Mode Button */}
				<TouchableOpacity
					onPress={() => setIsMultiLang((prev) => !prev)}
					style={{
						paddingVertical: 6,
						paddingHorizontal: 12,
						backgroundColor: isMultiLang ? '#3b82f6' : '#9ca3af',
						borderRadius: 20,
					}}
				>
					<Text style={{ color: 'white', fontWeight: 'bold' }}>
						{isMultiLang ? 'MultiLang On' : 'MultiLang Off'}
					</Text>
				</TouchableOpacity>

				<NavHeader />
			</View>

			<ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
				{isMultiLang ? (
					<>
						<MultiAnimeHome />
					</>
				) : (
					<>
						<BannerCarousel />
						<RecommendedAnime />
						<OngoingSeries />
						<TrendingAnime excludeIds={ongoingIds} />
						<MovieAnime excludeIds={ongoingIds} />
					</>
				)}
			</ScrollView>
		</View>
	);
};
