import { IAnime } from '@/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PlayCircle, Star } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import {
	GestureResponderEvent,
	Image,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export function AnimeCard({ anime }: { anime: IAnime }) {
	const router = useRouter();

	const handlePress = (event: GestureResponderEvent) => {
		event.stopPropagation();

		const id = anime.id?.toString();

		// Create a clean, kebab-case slug
		const rawTitle = anime.title?.romaji || anime.title?.english || 'unknown';
		const slug = rawTitle
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
			.replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens

		console.log(`Navigating to /watch with id=${id} & slug=${slug}`);

		router.push({
			pathname: '/watch',
			params: {
				id,
				slug,
			},
		});
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			className="rounded-lg shadow-md overflow-hidden"
		>
			<MotiView
				from={{ scale: 0.94, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'timing', duration: 400 }}
				className="w-60 rounded-2xl overflow-hidden bg-[#0f0f1b] shadow-md"
			>
				<View className="relative w-full h-28">
					<Image
						source={{ uri: anime.coverImage.large }}
						className="w-full h-full"
						resizeMode="cover"
					/>
					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.8)']}
						className="absolute bottom-0 w-full h-28"
					/>

					<View className="absolute top-2 left-2 bg-yellow-400 px-2 py-1 rounded-full flex-row items-center gap-1">
						<Star size={12} color="#000" />
						<Text className="text-black text-xs font-bold">
							{Math.round(anime.averageScore / 10) || 'N/A'}
						</Text>
					</View>

					<View className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full flex-row items-center">
						<PlayCircle size={12} color="#fff" />
						<Text className="text-white text-xs">Ep {anime.episodes}</Text>
					</View>
				</View>

				<View className="px-3 py-2">
					<Text
						numberOfLines={1}
						className="text-white font-semibold text-sm leading-tight truncate"
					>
						{anime.title.romaji ?? anime.title.english}
					</Text>

					<View className="flex-row flex-wrap mt-2">
						{anime.genres.slice(0, 2).map((genre) => (
							<View
								key={genre}
								className="bg-white/10 px-2 py-0.5 mr-2 mb-1 rounded-full"
							>
								<Text className="text-xs text-white">{genre}</Text>
							</View>
						))}
					</View>
				</View>
			</MotiView>
		</TouchableOpacity>
	);
}
