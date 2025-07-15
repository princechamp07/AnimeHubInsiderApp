import { Home } from '@/components';
import React from 'react';
import { SafeAreaView } from 'react-native';

const HomeScreen = () => {
	return (
		<SafeAreaView className='flex-1'>
			<Home />
		</SafeAreaView>
	);
};

export default HomeScreen;
