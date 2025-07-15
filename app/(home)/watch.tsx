import { fetchEpisodesFromAniList, fetchRelatedSeasons } from '@/api';
import RelatedSeasons from '@/components/RelatedSeasons';
import WatchPlayer from '@/components/WatchPlayer';
import { useLocalSearchParams } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
	FlatList,
	Image,
	Pressable,
	SafeAreaView,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	useColorScheme,
} from 'react-native';

type EpisodeType = {
	episode: number;
	title: string;
	image: string;
};

const RangeDropdown = ({
	options,
	selected,
	onSelect,
	darkMode,
}: {
	options: string[];
	selected: string;
	onSelect: (value: string) => void;
	darkMode: boolean;
}) => {
	const [visible, setVisible] = useState(false);

	return (
		<View className="relative">
			<TouchableOpacity
				activeOpacity={0.85}
				className={`flex-row items-center justify-between px-4 py-2 rounded-full shadow-sm min-w-[160px] border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
					}`}
				onPress={() => setVisible(!visible)}
			>
				<Text className={`${darkMode ? 'text-white' : 'text-black'} font-semibold`}>
					Range: {selected}
				</Text>
				<ChevronDown size={18} color={darkMode ? '#ccc' : '#4B5563'} />
			</TouchableOpacity>

			{visible && (
				<View className={`absolute top-12 z-50 w-48 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'
					}`}>
					<ScrollView className="max-h-64">
						{options.map((item) => (
							<Pressable
								key={item}
								onPress={() => {
									onSelect(item);
									setVisible(false);
								}}
								className={`px-4 py-2 ${item === selected ? (darkMode ? 'bg-blue-700' : 'bg-blue-500') : ''
									}`}
							>
								<Text className={item === selected ? 'text-white' : darkMode ? 'text-white' : 'text-black'}>
									{item}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>
			)}
		</View>
	);
};

export default function WatchAnime() {
	const { slug, id } = useLocalSearchParams();
	const animeId = id?.toString() ?? '';
	const slugId = slug?.toString();
	const darkMode = useColorScheme() === 'dark';

	const [episodes, setEpisodes] = useState<EpisodeType[]>([]);
	const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
	const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
	const [nextAiring, setNextAiring] = useState<{ episode: number; airingAt: number } | null>(null);
	const [countdown, setCountdown] = useState('');
	const [rangeOptions, setRangeOptions] = useState<string[]>([]);
	const [selectedRange, setSelectedRange] = useState<string>('');
	const [relatedSeasons, setRelatedSeasons] = useState<RelatedSeason[]>([]);

	useEffect(() => {
		if (animeId) {
			fetchEpisodesFromAniList(Number(animeId)).then((data) => {
				setEpisodes(data.episodes);
				setNextAiring(data.nextAiringEpisode || null);

				const lastAvailableEpisode = data.nextAiringEpisode
					? data.nextAiringEpisode.episode - 1
					: data.episodes[data.episodes.length - 1]?.episode || 1;

				setSelectedEpisode(lastAvailableEpisode);
				generateRangeOptions(data.episodes);
			});

			fetchRelatedSeasons(Number(animeId)).then(setRelatedSeasons);
		}
	}, [animeId]);

	const generateRangeOptions = (epList: EpisodeType[]) => {
		const ranges = [];
		const step = 25;
		const total = epList[epList.length - 1]?.episode || 1;
		for (let i = 1; i <= total; i += step) {
			ranges.push(`${i}-${Math.min(i + step - 1, total)}`);
		}
		setRangeOptions(ranges);
		setSelectedRange(ranges[ranges.length - 1]);
	};

	useEffect(() => {
		if (!nextAiring?.airingAt) return;

		const updateCountdown = () => {
			// ⏰ Add 2 extra hours (7200 seconds)
			const adjustedAiringAt = nextAiring.airingAt + 7200;
			const secondsLeft = adjustedAiringAt - Math.floor(Date.now() / 1000);

			if (secondsLeft <= 0) {
				setCountdown('Now airing!');
				return;
			}

			const days = Math.floor(secondsLeft / (3600 * 24));
			const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
			const minutes = Math.floor((secondsLeft % 3600) / 60);
			const seconds = secondsLeft % 60;

			setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [nextAiring]);


	const visibleEpisodes = episodes.filter((ep) => {
		const [start, end] = selectedRange.split('-').map(Number);
		const maxEpisode = nextAiring ? nextAiring.episode - 1 : end;
		return ep.episode >= start && ep.episode <= Math.min(end, maxEpisode);
	});

	return (
		<SafeAreaView className={`${darkMode ? 'bg-black' : 'bg-white'} flex-1`}>
			<ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
				{selectedEpisode && (
					<WatchPlayer
						animeId={`ani${animeId}`}
						slug={slugId}
						episode={selectedEpisode}
						language={language}
					/>
				)}

				{nextAiring && (
					<View className={`items-center px-4 py-3 mx-4 rounded-xl shadow-md border ${darkMode ? 'bg-yellow-900 border-yellow-600' : 'bg-yellow-100 border-yellow-300'}`}>
						<Text className={`${darkMode ? 'text-yellow-300' : 'text-yellow-800'} font-semibold text-base`}>
							⏰ Upcoming Episode <Text className="font-bold">{nextAiring.episode}</Text> airs in:
						</Text>
						<Text className={`${darkMode ? 'text-red-400' : 'text-red-600'} font-bold text-xl mt-1 tracking-wide`}>
							{countdown}
						</Text>
					</View>
				)}

				<View className="flex-row justify-between items-center mx-4 mt-4">
					<RangeDropdown
						options={rangeOptions}
						selected={selectedRange}
						onSelect={(item) => {
							setSelectedRange(item);
							const [_, end] = item.split('-').map(Number);
							const maxEp = nextAiring ? nextAiring.episode - 1 : end;
							setSelectedEpisode(maxEp);
						}}
						darkMode={darkMode}
					/>
					<View className="flex-row space-x-4">
						{['sub', 'dub'].map((lang) => (
							<TouchableOpacity
								key={lang}
								onPress={() => setLanguage(lang as 'sub' | 'dub')}
								className={`px-3 py-1 rounded-full ${language === lang ? 'bg-green-600' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
							>
								<Text className={language === lang ? 'text-white' : darkMode ? 'text-white' : 'text-black'}>
									{lang.toUpperCase()}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				<Text className={`text-center mt-4 font-bold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
					{language === 'dub' ? 'Dub Episodes' : 'Sub Episodes'}
				</Text>

				<FlatList
					data={visibleEpisodes}
					horizontal
					keyExtractor={(item) => item.episode.toString()}
					contentContainerStyle={{
						paddingHorizontal: 10,
						marginTop: 10,
						paddingBottom: 10,
					}}
					renderItem={({ item }) => (
						<TouchableOpacity
							onPress={() => setSelectedEpisode(item.episode)}
							className={`mr-4 ${item.episode === selectedEpisode ? 'border-2 border-blue-600 rounded-xl' : ''}`}
						>
							<Image
								source={{ uri: item.image }}
								style={{ width: 120, height: 70, borderRadius: 8 }}
								resizeMode="cover"
							/>
							<Text className={`text-center text-xs mt-1 ${darkMode ? 'text-white' : 'text-black'}`}>
								Episode: {item.episode}
							</Text>
						</TouchableOpacity>
					)}
				/>

				{relatedSeasons.length > 0 && <RelatedSeasons seasons={relatedSeasons} />}
			</ScrollView>
		</SafeAreaView>
	);
}
