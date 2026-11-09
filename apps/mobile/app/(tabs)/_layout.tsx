/**
 * EKUSA Mobile App - Main Tab Layout
 * 4-tab bottom navigation: Home, Chats, Events, Profile
 */

import { Tabs } from 'expo-router';
import { Home, MessageCircle, Calendar, User } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const { user } = useAuthStore();
  const { colorScheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].primary,
        tabBarInactiveTintColor: Colors[colorScheme].textSecondary,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].surface,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme].border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size - 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size - 4} color={color} />
          ),
          tabBarBadge: user ? undefined : '!',
        }}
      />
      {/* 4 main tabs: Home, Chats, Events, Profile */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size - 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size - 4} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}