import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Warm up browser
const useWarmUpBrowser = () => {
    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
    useWarmUpBrowser();
    const router = useRouter();

    const { signIn, setActive, isLoaded } = useSignIn();
    const { startSSOFlow } = useSSO();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 🔐 Traditional Email/Password login
    const onSignInPress = async () => {
        if (!isLoaded || loading) return;
        setLoading(true);

        try {
            const result = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });

                // ✅ Soft refresh without full reload
                router.replace('/');
            } else {
                console.log('Incomplete sign-in:', result);
            }
        } catch (err: any) {
            Alert.alert('Sign-in failed', err?.errors?.[0]?.message || 'Try again.');
        } finally {
            setLoading(false);
        }
    };

    // 🔐 Google OAuth login
    const onGoogleSignIn = useCallback(async () => {
        try {
            setLoading(true);

            const { createdSessionId, signUp, setActive: setSSOActive } = await startSSOFlow({
                strategy: 'oauth_google',
                redirectUrl: AuthSession.makeRedirectUri({ path: '/' }),
            });

            if (createdSessionId) {
                await setSSOActive?.({ session: createdSessionId });

                // ✅ Soft refresh
                router.replace('/');
            } else if (signUp?.status === 'missing_requirements') {
                const fullName = `${signUp.firstName || 'User'} ${signUp.lastName || ''}`;
                const imageUrl = signUp?.imageUrl || '';

                router.replace({
                    pathname: '/setup-profile',
                    params: {
                        signUpId: signUp.id,
                        fullName,
                        imageUrl,
                    },
                });
            } else {
                Alert.alert('Authentication Failed', 'Unexpected auth response.');
            }
        } catch (err: any) {
            console.error('SSO error:', err);
            Alert.alert('Google Sign-In Failed', err?.message || 'Try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <View className="flex-1 justify-center items-center bg-black px-6">
            <View className="w-full max-w-md">
                <Text className="text-white text-3xl font-bold mb-6">Welcome Back</Text>

                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white mb-4"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white mb-4"
                />

                <TouchableOpacity
                    onPress={onSignInPress}
                    className="bg-indigo-500 rounded-xl py-3 mb-4"
                    disabled={loading}
                >
                    <Text className="text-center text-white text-base font-semibold">
                        {loading ? 'Loading...' : 'Continue'}
                    </Text>
                </TouchableOpacity>

                <Text className="text-gray-400 text-center my-4">or</Text>

                <TouchableOpacity
                    onPress={onGoogleSignIn}
                    className="bg-white rounded-xl py-3"
                    disabled={loading}
                >
                    <Text className="text-center text-black text-base font-semibold">
                        Sign in with Google
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-6">
                    <Text className="text-gray-400">Don't have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/sign-up')}>
                        <Text className="text-indigo-400 font-medium ml-1">Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
