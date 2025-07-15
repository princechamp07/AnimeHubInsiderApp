import { fetchOngoingSeries } from '@/api';
import { useEffect, useState } from 'react';
import { ScrollView, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerCarousel } from './BannerCarousel';
import { MovieAnime } from './MovieAnime';
import { NavHeader } from './NavHeader';
import { OngoingSeries } from './OngoingSeries';
import { RecommendedAnime } from './RecommendedAnime';
import { TrendingAnime } from './TrendingAnime';

export const Home = () => {
	const [ongoingIds, setOngoingIds] = useState<number[]>([]);
	const colorScheme = useColorScheme(); // "dark" | "light" | null
	const insets = useSafeAreaInsets();

	useEffect(() => {
		const loadOngoing = async () => {
			const ongoing = await fetchOngoingSeries();
			const ids = ongoing.map((anime) => anime.id);
			setOngoingIds(ids);
		};
		loadOngoing();
	}, []);

	// Determine backgroundColor for inline sections
	const bgColor = colorScheme === 'dark' ? '#111827' : '#ffffff'; // dark:bg-gray-900

	return (
		<View className="flex-1 bg-white dark:bg-gray-900">
			<View style={{ paddingTop: insets.top, backgroundColor: bgColor }}>
				<NavHeader />
			</View>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: 20,
				}}
			>
				<BannerCarousel />
				<RecommendedAnime />
				<OngoingSeries />
				<TrendingAnime excludeIds={ongoingIds} />
				<MovieAnime excludeIds={ongoingIds} />
			</ScrollView>

		</View>
	);
};
