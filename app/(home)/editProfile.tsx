import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, isLoaded } = useUser();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [uploading, setUploading] = useState(false);

    // Populate user data when available
    useEffect(() => {
        if (isLoaded && user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setUsername(user.username || '');
            setProfileImage(user.imageUrl || '');
        }
    }, [isLoaded, user]);

    if (!isLoaded || !user) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-black">
                <Text className="text-gray-500">Loading user info...</Text>
            </View>
        );
    }

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Allow photo access to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);

            try {
                setUploading(true);

                // 👇 Convert the picked image to a blob
                const response = await fetch(uri);
                const blob = await response.blob();

                // 👇 Create a File object (Clerk expects Blob | File)
                const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

                await user.setProfileImage({ file });
            } catch (err) {
                console.error('Image upload error:', err);
                Alert.alert('Upload Failed', 'Could not update profile picture.');
            } finally {
                setUploading(false);
            }
        }

    };

    const handleSave = async () => {
        if (!firstName || !lastName || !username) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }

        try {
            await user.update({
                firstName,
                lastName,
                username,
            });
            Alert.alert('✅ Profile Updated', 'Your changes have been saved!');
            router.back();
        } catch (err) {
            console.error('❌ Update error:', err);
            Alert.alert('Update Failed', 'Could not update your profile.');
        }
    };

    return (
        <ScrollView className="flex-1 bg-white dark:bg-black px-6 pt-10">
            <Text className="text-2xl font-bold text-center text-black dark:text-white mb-6">
                Edit Profile
            </Text>

            {/* Profile Image */}
            <View className="items-center mb-3 relative">
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    <Image
                        source={{ uri: profileImage }}
                        className="w-28 h-28 rounded-full border-4 border-blue-500"
                    />
                    <View className="absolute bottom-1 right-2 bg-blue-600 p-1 rounded-full">
                        <Pencil size={14} color="white" />
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={pickImage}
                className="self-center mb-6"
                activeOpacity={0.8}
            >
                <Text className="text-blue-600 text-sm font-medium">Change Profile Picture</Text>
            </TouchableOpacity>

            {/* First Name */}
            <Text className="text-gray-600 dark:text-gray-300 mb-1">First Name</Text>
            <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 mb-4 text-black dark:text-white"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#999"
            />

            {/* Last Name */}
            <Text className="text-gray-600 dark:text-gray-300 mb-1">Last Name</Text>
            <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 mb-4 text-black dark:text-white"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#999"
            />

            {/* Username */}
            <Text className="text-gray-600 dark:text-gray-300 mb-1">Username</Text>
            <TextInput
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 mb-8 text-black dark:text-white"
                value={username}
                onChangeText={setUsername}
                placeholder="@username"
                placeholderTextColor="#999"
            />

            {/* Save Button */}
            <TouchableOpacity
                onPress={handleSave}
                className={`bg-green-600 py-3 rounded-full mb-10 ${uploading ? 'opacity-70' : ''}`}
                activeOpacity={0.9}
                disabled={uploading}
            >
                <Text className="text-white text-center font-bold text-base">
                    {uploading ? 'Saving...' : '💾 Save Changes'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
