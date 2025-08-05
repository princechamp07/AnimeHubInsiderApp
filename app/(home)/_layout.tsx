import { NavFooter } from '@/components/NavFooter';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { Text, View, useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import '../../global.css';

export default function RootLayout() {
    const { isLoaded, isSignedIn } = useAuth();

    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    const isDark = colorScheme === 'dark';

    if (!isLoaded) {
        return (
            <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: isDark ? '#000' : '#fff' }}
            >
                <Text style={{ color: isDark ? '#fff' : '#000' }}>Loading...</Text>
            </View>
        );
    }

    if (isSignedIn) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    return (
        <View
            className="flex-1"
            style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }} // dark:bg-gray-900 or white
        >
            <View className="flex-1">
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="watch" options={{ headerShown: false }} />
                    <Stack.Screen name="movie-watch" options={{ headerShown: false }} />
                </Stack>
            </View>

            {/* ✅ Footer now visible on all screens */}
            <View style={{ paddingBottom: insets.bottom }}>
                <NavFooter />
            </View>
        </View>
    );
}
