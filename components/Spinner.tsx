import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface AppSpinnerProps {
	/**
	 * The color of the spinner. Defaults to your app's primary color or a standard blue.
	 */
	color?: string;
	/**
	 * The size of the spinner. Can be 'small' or 'large'. Defaults to 'small'.
	 */
	size?: 'small' | 'large';
}

export function AppSpinner({ color, size = 'small' }: AppSpinnerProps) {
	return (
		<View style={styles.container}>
			<ActivityIndicator
				size={size}
				color={color || '#0000ff'}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1, // Ensures the spinner takes up available space for centering
		justifyContent: 'center', // Centers vertically
		alignItems: 'center', // Centers horizontally
	},
});
