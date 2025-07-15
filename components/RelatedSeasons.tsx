import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

type RelatedSeason = {
    relationType: string;
    node: {
        id: number;
        title: { romaji: string; english: string };
        coverImage: { large: string };
        episodes: number;
    };
};

export default function RelatedSeasons({
    seasons,
}: {
    seasons: RelatedSeason[];
}) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const darkMode = colorScheme === 'dark';

    return (
        <View className="mt-6 px-4">
            <Text
                className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-black'}`}
            >
                📺 Related Seasons
            </Text>

            <FlatList
                data={seasons}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.node.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="mr-4"
                        onPress={() =>
                            router.push({
                                pathname: '/watch',
                                params: { id: item.node.id },
                            })
                        }
                    >
                        <Image
                            source={{ uri: item.node.coverImage.large }}
                            style={{ width: 100, height: 140, borderRadius: 10 }}
                            resizeMode="cover"
                        />
                        <Text
                            numberOfLines={2}
                            className={`text-xs mt-1 font-semibold w-24 ${darkMode ? 'text-white' : 'text-black'}`}
                        >
                            {item.node.title.romaji || item.node.title.english}
                        </Text>
                        <Text className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            🎬 {item.node.episodes ?? 'N/A'} eps
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
