import React from 'react';
import { Text, View, useColorScheme } from 'react-native';

export function NavHeader() {
    const theme = useColorScheme(); // 'dark' or 'light'
    const isDark = theme === 'dark';

    return (
        <View
            className="w-full py-4 shadow-md items-center"
            style={{
                backgroundColor: isDark ? '#111827' : '#ffffff', // dark:bg-gray-900 / bg-white
            }}
        >
            <Text className="text-2xl font-extrabold text-green-600 tracking-wide">
                Anime
                <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Hub</Text>
                <Text className="text-blue-600">Insider</Text>
            </Text>
        </View>
    );
}
