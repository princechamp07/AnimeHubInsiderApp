import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import {
    ActivityIndicator,
    Image,
    Text,
    View,
} from 'react-native';

export default function AuthRoutesLayout() {
    const { isLoaded, isSignedIn } = useAuth();

    // Wait for Clerk to finish loading
    if (!isLoaded) {
        return (
            <View className="flex-1 relative bg-black">
                <Image
                    source={require('@/assets/images/adaptive-icon.png')}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        resizeMode: 'cover',
                        opacity: 0.9,
                    }}
                />
                <View className="absolute inset-0 bg-black/70" />
                <View className="flex-1 justify-center items-center z-10">
                    <ActivityIndicator size="large" color="#fff" />
                    <Text className="text-white mt-4 text-base font-semibold">
                        Loading...
                    </Text>
                </View>
            </View>
        );
    }

    // ✅ Only redirect once Clerk is fully ready
    if (isSignedIn) {
        return <Redirect href="/" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="setup-profile" />
        </Stack>
    );
}
