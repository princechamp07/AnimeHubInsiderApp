import { useAuth, useSignUp } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SetupProfile() {
    const router = useRouter();
    const { setActive, isSignedIn, isLoaded: authLoaded } = useAuth();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();

    const { signUpId, fullName = 'User', imageUrl } = useLocalSearchParams<{
        signUpId: string;
        fullName: string;
        imageUrl?: string;
    }>();

    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    // Ensure we're using the correct signUp instance
    useEffect(() => {
        if (signUp?.id && signUp.id !== signUpId) {
            void signUp.reload();
        }
    }, [signUpId]);

    const onComplete = async () => {
        if (!username.match(/^[a-zA-Z0-9-_]{3,}$/)) {
            Alert.alert(
                'Invalid username',
                'Only letters, numbers, dashes, and underscores allowed (min 3 characters).'
            );
            return;
        }

        if (!signUp || !signUpLoaded || !authLoaded) {
            Alert.alert('Error', 'Sign-up session not available.');
            return;
        }

        try {
            setLoading(true);

            // If already signed in, just go home
            if (isSignedIn) {
                router.replace('/');
                return;
            }

            await signUp.update({
                username,
                unsafeMetadata: { fullName },
            });

            const result = await signUp.create({});

            if (result?.createdSessionId) {
                await setActive({ session: result.createdSessionId });

                // ✅ Soft redirect instead of full app reload
                router.replace('/');
            } else {
                throw new Error('No session was created');
            }
        } catch (err: any) {
            const message = err?.message || 'Please try again.';
            if (message.includes('already signed in')) {
                router.replace('/');
                return;
            }

            console.error('Signup complete error:', err);
            Alert.alert('Signup failed', message);
        } finally {
            setLoading(false);
        }
    };

    const finalImage =
        imageUrl && imageUrl !== '' && imageUrl !== 'undefined'
            ? imageUrl
            : 'https://www.gravatar.com/avatar/?d=mp&f=y';

    return (
        <View className="flex-1 items-center justify-center bg-black px-6">
            <View className="w-full max-w-md">
                <Text className="text-white text-2xl font-bold mb-4 text-center">
                    Set up your profile
                </Text>

                <Image
                    source={{ uri: finalImage }}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        alignSelf: 'center',
                        marginBottom: 20,
                    }}
                />

                <TextInput
                    placeholder="Username"
                    placeholderTextColor="#aaa"
                    value={username}
                    onChangeText={setUsername}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white mb-6"
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    onPress={onComplete}
                    className="bg-indigo-500 rounded-xl py-3"
                    disabled={loading}
                >
                    <Text className="text-white text-center font-semibold">
                        {loading ? 'Creating...' : 'Complete Sign Up'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
