import { fetchTrendingAnime } from '@/api';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Pressable,
	SafeAreaView,
	Text,
	View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Header } from './Header';

const { width } = Dimensions.get('window');

type BannerAnime = {
	id: number;
	title: { romaji?: string; english?: string };
	genres: string[];
	image: string;
};

export function BannerCarousel() {
	const [banners, setBanners] = useState<BannerAnime[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		async function loadData() {
			try {
				const animeList = await fetchTrendingAnime();
				console.log('🔍 Raw Trending Anime:', animeList);

				const topAnime = animeList
					.slice(0, 10)
					.map((anime: any) => ({
						id: anime?.id ?? 0,
						title: anime?.title ?? { romaji: 'Unknown' },
						genres: Array.isArray(anime?.genres) ? anime.genres : [],
						image:
							anime?.coverImage?.extraLarge ||
							anime?.coverImage?.large ||
							anime?.coverImage?.medium ||
							'https://placehold.co/600x300?text=No+Image',
					}));

				console.log('✅ Filtered Banners:', topAnime);

				// Fallback if no banners
				if (topAnime.length === 0) {
					topAnime.push({
						id: 9999,
						title: { romaji: 'Demo Anime' },
						genres: ['Action', 'Fantasy'],
						image: 'https://placehold.co/600x300?text=Demo+Banner',
					});
				}

				setBanners(topAnime);
			} catch (err) {
				console.error('❌ Failed to fetch trending anime:', err);
			} finally {
				setLoading(false);
			}
		}

		loadData();
	}, []);

	const handleNavigate = (anime: BannerAnime) => {
		router.push({
			pathname: '/watch',
			params: {
				id: anime.id.toString(),
				slug: anime.title.romaji ?? anime.title.english ?? 'Unknown Anime',
			},
		});
	};

	if (loading) {
		return (
			<View className="items-center justify-center h-[300px]">
				<ActivityIndicator size="large" color="#10B981" />
			</View>
		);
	}

	if (!banners.length) {
		return (
			<View className="items-center justify-center h-[300px] bg-gray-100">
				<Text className="text-gray-500 text-lg">No banners available.</Text>
			</View>
		);
	}

	return (
		<SafeAreaView>
			<View>
				<Carousel
					loop
					width={width}
					height={260}
					autoPlay
					data={banners}
					scrollAnimationDuration={3000}
					renderItem={({ item }) => (
						<Pressable onPress={() => handleNavigate(item)}>
							<MotiView
								from={{ opacity: 0, translateY: 20 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{ type: 'timing', duration: 600 }}
								className="relative"
							>
								<Image
									source={{ uri: item.image }}
									className="w-full h-full"
									resizeMode="cover"
								/>
							
								<View className="absolute bottom-5 left-5 right-5">
									<Text
										className="text-white text-lg font-semibold"
										numberOfLines={1}
									>
										{item.title.romaji ?? item.title.english}
									</Text>
									<Text
										className="text-white text-xs mt-1"
										numberOfLines={1}
									>
										{Array.isArray(item.genres) && item.genres.length > 0
											? item.genres.join(', ')
											: 'No genres'}
									</Text>

									<View className="flex-row mt-3 space-x-3 gap-2">
										<Pressable
											onPress={() => handleNavigate(item)}
											className="bg-green-500 px-5 py-1.5 rounded-full"
										>
											<Text className="text-white font-semibold">▶ Play</Text>
										</Pressable>
										<Pressable className="border border-white px-5 py-1.5 rounded-full">
											<Text className="text-white font-semibold">＋ My List</Text>
										</Pressable>
									</View>
								</View>
							</MotiView>
						</Pressable>
					)}
				/>
			</View>
		</SafeAreaView>
	);
}
