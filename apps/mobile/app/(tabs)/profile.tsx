/**
 * EKUSA Mobile App - Profile Screen
 * Account and membership management
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, authApi, membershipApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';
import { MembershipBadge } from '@/components/MembershipBadge';
import { router } from 'expo-router';
import type { MembershipApplication, User as UserType } from '@ekusa/shared-types';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuthStore();
  const { colors, colorScheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: profile, refetch: refetchProfile } = useQuery<UserType>({
    queryKey: ['user-profile'],
    queryFn: () => authApi.getCurrentUser() as Promise<UserType>,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: membership } = useQuery<MembershipApplication>({
    queryKey: ['membership-status'],
    queryFn: () => membershipApi.getMyStatus() as Promise<MembershipApplication>,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to log out');
    },
  });

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logoutMutation.mutate() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { /* Navigate to delete confirmation */ } },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Text style={[styles.authPromptTitle, { color: colors.textPrimary }]}>Please log in</Text>
          <Text style={[styles.authPromptText, { color: colors.textSecondary }]}>You need to be logged in to view your profile.</Text>
        </View>
      </View>
    );
  }

  const displayUser = profile || user;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
        <Avatar
          source={displayUser?.avatarUrl ? { uri: displayUser.avatarUrl } : undefined}
          name={displayUser?.displayName || displayUser?.username}
          size="xlarge"
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.displayName, { color: colors.textPrimary }]}>
            {displayUser?.displayName || displayUser?.username}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{displayUser?.username}
          </Text>
          <View style={styles.badgeRow}>
            <MembershipBadge status={displayUser?.accountStatus || 'registered'} size="medium" />
          </View>
        </View>
      </View>

      {/* Membership Status Card */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Membership Status</Text>
        </View>
        <View style={styles.membershipCard}>
          <View style={styles.membershipMain}>
            <MembershipBadge status={displayUser?.accountStatus || 'registered'} size="large" showIcon={true} />
            <View style={styles.membershipText}>
              <Text style={[styles.membershipLabel, { color: colors.textSecondary }]}>Current Status</Text>
              <Text style={[styles.membershipValue, { color: colors.textPrimary }]}>
                {getMembershipLabel(displayUser?.accountStatus)}
              </Text>
            </View>
          </View>
          {membership && (
            <View style={styles.membershipDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Registration No.</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{membership.registrationNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Campus</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{membership.campus}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Course</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{membership.course}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Year of Study</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{membership.yearOfStudy}</Text>
              </View>
              {membership.rejectionReason && (
                <View style={styles.rejectionReason}>
                  <Text style={[styles.detailLabel, { color: colors.error }]}>Rejection Reason</Text>
                  <Text style={[styles.detailValue, { color: colors.error }]}>{membership.rejectionReason}</Text>
                </View>
              )}
            </View>
          )}
          {displayUser?.accountStatus !== 'verified_member' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(auth)/membership-apply')}>
              <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>Apply for Membership</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.settingsContainer}>
        {[
          {
            title: 'Account',
            items: [
              { label: 'Edit Profile', route: '/profile/edit' },
              { label: 'Change Password', route: '/profile/password' },
              { label: 'Linked Accounts', route: '/profile/linked' },
            ],
          },
          {
            title: 'Privacy & Security',
            items: [
              { label: 'Privacy Settings', route: '/settings/privacy' },
              { label: 'Blocked Users', route: '/settings/blocked' },
              { label: 'Two-Factor Authentication', route: '/settings/2fa' },
              { label: 'Active Sessions', route: '/settings/sessions' },
            ],
          },
          {
            title: 'Notifications',
            items: [
              { label: 'Push Notifications', route: '/settings/notifications' },
              { label: 'Email Preferences', route: '/settings/email' },
              { label: 'Announcement Alerts', route: '/settings/announcements' },
            ],
          },
          {
            title: 'Messaging',
            items: [
              { label: 'Chat Settings', route: '/settings/chat' },
              { label: 'Encryption Keys', route: '/settings/encryption' },
              { label: 'Data & Storage', route: '/settings/storage' },
            ],
          },
          {
            title: 'Danger Zone',
            items: [
              { label: 'Log Out', action: handleLogout, destructive: true },
              { label: 'Delete Account', action: handleDeleteAccount, destructive: true },
            ],
          },
        ].map((section) => (
          <SettingsSection key={section.title} section={section} colorScheme={colorScheme} />
        ))}
      </View>

      {/* App Info */}
      <View style={[styles.appInfo, { backgroundColor: colors.surface }]}>
        <Text style={[styles.appVersion, { color: colors.textTertiary }]}>EKUSA Digital Platform v1.0.0</Text>
        <Text style={[styles.appBuild, { color: colors.textTertiary }]}>Build 2024.01.15</Text>
      </View>
    </ScrollView>
  );
}

function getMembershipLabel(status: string): string {
  const labels: Record<string, string> = {
    none: 'Not Applied',
    registered: 'Registered (Not Applied)',
    pending: 'Pending Verification',
    membership_pending: 'Pending Verification',
    verified: 'Verified Member',
    verified_member: 'Verified Member',
    rejected: 'Application Rejected',
    suspended: 'Membership Suspended',
  };
  return labels[status] || 'Unknown';
}

function SettingsSection({ section, colorScheme }: { section: any; colorScheme: 'light' | 'dark' }) {
  const colors = Colors[colorScheme];
  return (
    <View style={[styles.settingsSection, { backgroundColor: colors.surface }]}>
      <Text style={[styles.settingsSectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
      {section.items.map((item: any, index: number) => (
        <TouchableOpacity
          key={item.label}
          style={[
            styles.settingsItem,
            index === section.items.length - 1 ? { borderBottomWidth: 0 } : {},
            item.destructive && { backgroundColor: colors.errorContainer },
          ]}
          onPress={item.action || (() => { /* navigate(item.route) */ })}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            {item.icon ? <Text style={styles.itemIcon}>{item.icon}</Text> : null}
            <Text style={[styles.itemLabel, item.destructive ? { color: colors.error } : { color: colors.textPrimary }]}>
              {item.label}
            </Text>
          </View>
          {!item.action && <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  profileHeader: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInfo: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  displayName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  username: {
    fontSize: Typography.sizes.md,
    marginTop: Spacing.xs,
  },
  badgeRow: {
    marginTop: Spacing.md,
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  membershipCard: {
    gap: Spacing.md,
  },
  membershipMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  membershipText: {
    flex: 1,
  },
  membershipLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  membershipValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginTop: 2,
  },
  membershipDetails: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  detailValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  rejectionReason: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.errorContainer,
  },
  actionButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  settingsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  settingsSection: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  settingsSectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surfaceVariant,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  appInfo: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
    marginTop: Spacing.lg,
  },
  appVersion: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  appBuild: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  authPromptTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});