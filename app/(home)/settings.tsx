import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { LogOut, Pencil } from 'lucide-react-native'; // ✅ Lucide Icons
import React from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { userId, signOut } = useAuth();


    if (!isLoaded) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-black">
                <Text className="text-gray-500">Loading user info...</Text>
            </View>
        );
    }

    const handleLogout = async () => {
        Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await signOut();
                    } catch (err) {
                        console.error('Logout failed:', err);
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView className='flex-1 bg-white dark:bg-gray-900'>
            <ScrollView className="flex-1 bg-white dark:bg-black px-6 pt-10">
                <Text className="text-2xl font-bold text-center text-black dark:text-white mb-6">
                    Settings
                </Text>

                {/* Profile Image */}
                <View className="items-center mb-6 relative">
                    <Image
                        source={{
                            uri: user?.imageUrl ?? 'https://i.pravatar.cc/150?u=fallback',
                        }}
                        className="w-28 h-28 rounded-full border-4 border-blue-500"
                    />
                </View>

                {/* User Info */}
                <Text className="text-center text-lg font-semibold text-black dark:text-white">
                    @{user?.username ?? user?.primaryEmailAddress?.emailAddress}
                </Text>
                <Text className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {user?.firstName} {user?.lastName}
                </Text>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    className="bg-blue-600 mt-6 py-3 px-4 rounded-full flex-row items-center justify-center gap-2"
                    onPress={() => router.push('/editProfile')}
                >
                    <Pencil size={18} color="white" />
                    <Text className="text-white text-base font-semibold">Edit Profile</Text>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                    className="mt-10 py-3 px-4 rounded-full border border-red-500 flex-row items-center justify-center gap-2"
                    onPress={handleLogout}
                >
                    <LogOut size={18} color="red" />
                    <Text className="text-red-500 text-base font-semibold">Logout</Text>
                </TouchableOpacity>
            </ScrollView>

        </SafeAreaView>
    );
}
