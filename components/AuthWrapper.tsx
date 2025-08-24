import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, backendUser, loading } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!loading && !user && !backendUser) {
      // Redirect to login if user is not authenticated (either Firebase or backend)
      router.replace('/auth/login');
    }
  }, [user, backendUser, loading]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? 'light'].tint}
        />
      </View>
    );
  }

  if (!user && !backendUser) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
