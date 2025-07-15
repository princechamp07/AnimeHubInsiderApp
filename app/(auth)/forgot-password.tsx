import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ForgotPasswordScreen() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [phase, setPhase] = useState<'start' | 'verify'>('start');

    const handleSendCode = async () => {
        if (!isLoaded) return;
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            setPhase('verify');
        } catch (err: any) {
            Alert.alert('Error', err?.errors?.[0]?.longMessage || 'Failed to send reset code.');
        }
    };

    const handleVerifyAndReset = async () => {
        if (!isLoaded) return;
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                Alert.alert('Success', 'Password reset successful!');
                router.replace('/');
            } else {
                Alert.alert('Error', 'Reset incomplete. Try again.');
            }
        } catch (err: any) {
            Alert.alert('Error', err?.errors?.[0]?.longMessage || 'Something went wrong.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-center items-center bg-black px-6"
        >
            <View className="w-full max-w-md">
                <Text className="text-white text-3xl font-bold mb-6 text-center">
                    Reset Password
                </Text>

                {phase === 'start' ? (
                    <>
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#888"
                            value={email}
                            onChangeText={setEmail}
                            className="bg-zinc-800 text-white px-4 py-3 rounded-xl mb-6"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={handleSendCode}
                            className="bg-indigo-500 py-3 rounded-xl"
                        >
                            <Text className="text-white text-center font-semibold">Send Reset Code</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TextInput
                            placeholder="Verification Code"
                            placeholderTextColor="#888"
                            value={code}
                            onChangeText={setCode}
                            className="bg-zinc-800 text-white px-4 py-3 rounded-xl mb-4"
                            keyboardType="numeric"
                        />

                        <TextInput
                            placeholder="New Password"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            className="bg-zinc-800 text-white px-4 py-3 rounded-xl mb-6"
                        />

                        <TouchableOpacity
                            onPress={handleVerifyAndReset}
                            className="bg-indigo-500 py-3 rounded-xl"
                        >
                            <Text className="text-white text-center font-semibold">Reset Password</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
