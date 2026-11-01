/**
 * EKUSA Mobile App - Push Notification Service
 * Handles FCM token registration, notification display, and deep linking
 */

import React from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'announcement' | 'message' | 'event' | 'membership' | 'welfare' | 'system';
  referenceId: string;
  title: string;
  body: string;
  priority: 'normal' | 'high';
  data?: Record<string, string>;
}

export class NotificationService {
  private static instance: NotificationService;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B5E20',
      });

      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B5E20',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1565C0',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('critical', {
        name: 'Critical Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#C62828',
        sound: 'default',
        bypassDnd: true,
      });
    }

    // Set up listeners
    this.setupListeners();
  }

  private setupListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      this.handleNotificationReceived(notification);
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data as NotificationData;
    console.log('Notification received:', data);

    // Update badge count
    this.updateBadgeCount();

    // Emit event for in-app UI updates
    // You could use a global event emitter here
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as NotificationData;
    console.log('Notification tapped:', data);

    // Deep link based on notification type
    this.navigateToNotification(data);
  }

  private navigateToNotification(data: NotificationData): void {
    // Use router to navigate - in a real app, you'd import router from expo-router
    // This is a simplified version
    switch (data.type) {
      case 'announcement':
        // Navigate to announcement detail
        break;
      case 'message':
        // Navigate to chat
        break;
      case 'event':
        // Navigate to event detail
        break;
      case 'membership':
        // Navigate to membership status
        break;
      case 'welfare':
        // Navigate to welfare request
        break;
      default:
        // Navigate to home
        break;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      })).data;

      console.log('Expo push token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  async sendTokenToServer(token: string): Promise<void> {
    try {
      await apiClient.post('/devices', {
        deviceName: `${Platform.OS} Device`,
        identityPublicKey: '', // Will be filled by crypto service
        registrationId: 0, // Will be filled by crypto service
        pushToken: token,
      });
    } catch (error) {
      console.error('Failed to send push token to server:', error);
    }
  }

  async updateBadgeCount(): Promise<void> {
    try {
      // In a real app, you'd fetch the unread count from the server
      const count = 0; // placeholder
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: data.priority === 'high' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: trigger || null,
    });
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  // Get initial notification if app was launched from notification
  async getInitialNotification(): Promise<Notifications.Notification | null> {
    const notification = await Notifications.getLastNotificationResponseAsync();
    return notification?.notification || null;
  }

  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = NotificationService.getInstance();

// React hook for using notifications in components
export function useNotifications() {
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (user) {
      notificationService.initialize();
      notificationService.registerForPushNotifications().then(token => {
        if (token) {
          notificationService.sendTokenToServer(token);
        }
      });
    }

    return () => {
      notificationService.cleanup();
    };
  }, [user]);
}