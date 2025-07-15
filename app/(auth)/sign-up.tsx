import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const onSignUpPress = async () => {
        if (!isLoaded) return;

        try {
            await signUp.create({
                emailAddress,
                password,
                firstName,
                lastName,
                username,
            });

            await signUp.prepareEmailAddressVerification({
                strategy: 'email_code',
            });

            setPendingVerification(true);
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
        }
    };

    const onVerifyPress = async () => {
        if (!isLoaded) return;

        try {
            const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

            if (signUpAttempt.status === 'complete') {
                await setActive({ session: signUpAttempt.createdSessionId });
                router.replace('/');
            } else {
                console.error(JSON.stringify(signUpAttempt, null, 2));
            }
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 justify-center items-center px-6 bg-black"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View className="w-full max-w-md bg-[#1a1a1a] p-6 rounded-2xl shadow-lg">
                {pendingVerification ? (
                    <>
                        <Text className="text-white text-2xl font-bold mb-6 text-center">
                            Verify your email
                        </Text>

                        <TextInput
                            value={code}
                            placeholder="Verification code"
                            placeholderTextColor="#888"
                            onChangeText={setCode}
                            className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-6"
                            keyboardType="numeric"
                        />

                        <TouchableOpacity
                            className="bg-purple-600 py-3 rounded-xl mb-2"
                            onPress={onVerifyPress}
                        >
                            <Text className="text-white text-center font-semibold">Verify</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text className="text-white text-2xl font-bold mb-6 text-center">
                            Create an Account
                        </Text>

                        <View>
                            <TextInput
                                value={firstName}
                                placeholder="First name"
                                placeholderTextColor="#888"
                                onChangeText={setFirstName}
                                className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                            />
                            <TextInput
                                value={lastName}
                                placeholder="Last name"
                                placeholderTextColor="#888"
                                onChangeText={setLastName}
                                className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                            />
                            <TextInput
                                value={username}
                                placeholder="Username"
                                placeholderTextColor="#888"
                                onChangeText={setUsername}
                                className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                            />
                            <TextInput
                                autoCapitalize="none"
                                value={emailAddress}
                                placeholder="Email"
                                placeholderTextColor="#888"
                                onChangeText={setEmailAddress}
                                keyboardType="email-address"
                                className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                            />
                            <TextInput
                                value={password}
                                placeholder="Password"
                                placeholderTextColor="#888"
                                secureTextEntry
                                onChangeText={setPassword}
                                className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                            />
                        </View>


                        <TouchableOpacity
                            onPress={onSignUpPress}
                            className="bg-purple-600 py-3 rounded-xl mt-6"
                        >
                            <Text className="text-white text-center font-semibold">Continue</Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-4">
                            <Text className="text-neutral-400">Already have an account? </Text>
                            <Link href="/sign-in">
                                <Text className="text-purple-400 font-semibold">Sign in</Text>
                            </Link>
                        </View>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
