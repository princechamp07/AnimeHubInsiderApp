import { usePathname, useRouter } from 'expo-router';
import { Clapperboard, Home, Search, Settings } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const NavFooter = () => {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Movies', icon: Clapperboard, path: '/movies' }, // 🎬 New Movies Tab
        { name: 'Search', icon: Search, path: '/search' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <View className="flex-row justify-between px-6 py-3 items-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {tabs.map(({ name, icon: Icon, path }) => {
                const isActive = pathname === path;
                return (
                    <TouchableOpacity
                        key={name}
                        onPress={() => router.push(path)}
                        className="items-center space-y-1"
                    >
                        <Icon color={isActive ? '#10B981' : '#6B7280'} size={24} />
                        <Text className={`text-xs ${isActive ? 'text-green-500 font-semibold' : 'text-gray-500'}`}>
                            {name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
