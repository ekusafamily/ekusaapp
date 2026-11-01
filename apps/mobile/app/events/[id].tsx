/**
 * EKUSA Mobile App - Event Detail Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { MapPin, Calendar, Clock, Users, DollarSign, Pin } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import type { ColorPalette } from '@/constants/DesignTokens';
import { router } from 'expo-router';
import { format } from 'date-fns';
import type { Event } from '@ekusa/shared-types';

interface RouteParams {
  id: string;
}

export default function EventDetailScreen({ route }: { route: { params: RouteParams } }) {
  const { id: eventId } = route.params;
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: event, isLoading, refetch } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId) as Promise<Event>,
    staleTime: 5 * 60 * 1000,
  });

  const registrationMutation = useMutation({
    mutationFn: () => eventsApi.register(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      Alert.alert('Success', 'Successfully registered for the event!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Registration failed');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => eventsApi.cancelRegistration(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      Alert.alert('Cancelled', 'Your registration has been cancelled.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Cancellation failed');
    },
  });

  const handleRegister = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to register for events.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (event && event.registrationFee > 0) {
      Alert.alert(
        'Registration Fee',
        `This event has a registration fee of KES ${formatCurrency(event.registrationFee)}. Payment processing will be available in a future release.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Register Anyway', onPress: () => registrationMutation.mutate() },
        ]
      );
    } else {
      registrationMutation.mutate();
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loadingContainer} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundTitle, { color: colors.textPrimary }]}>Event Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back to Events</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isRegistered = event.registrationStatus === 'registered';
  const isRegistrationOpen = new Date(event.registrationDeadline) > new Date();
  const isEventPast = new Date(event.startAt) < new Date();
  const canRegister = !isRegistered && isRegistrationOpen && !isEventPast;
  const canCancel = isRegistered && !isEventPast;

  const categoryColors: Record<string, string> = {
    meeting: '#1565C0',
    hike: '#2E7D32',
    trip: '#6A1B9A',
    social: '#E65100',
    sports: '#C62828',
    academic: '#006064',
    cultural: '#AD1457',
    welfare: '#2E7D32',
  };

  const categoryColor = categoryColors[event.category] || colors.primary;
  const categoryLabels: Record<string, string> = {
    meeting: 'Meeting',
    hike: 'Hike',
    trip: 'Trip',
    social: 'Social',
    sports: 'Sports',
    academic: 'Academic',
    cultural: 'Cultural',
    welfare: 'Welfare',
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Event Header Image */}
      {event.avatarObjectKey && (
        <Image
          source={{ uri: `https://storage.example.com/${event.avatarObjectKey}` }}
          style={styles.headerImage}
          resizeMode="cover"
        />
      )}

      {/* Event Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {categoryLabels[event.category] || event.category}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(event.status, colors) + '20' },
          ]}>
            <Text style={[styles.statusText, { color: getStatusColor(event.status, colors) }]}>
              {formatStatus(event.status)}
            </Text>
          </View>
          {event.pinned && (
            <View style={styles.pinBadge}>
              <Pin size={12} color={categoryColor} />
              <Text style={{ color: categoryColor }}> Pinned</Text>
            </View>
          )}
        </View>

        {/* Meta Info */}
        <View style={styles.metaGrid}>
          <MetaItem icon={<MapPin size={20} color={colors.textTertiary} />} label="Venue" value={event.venue} colorScheme={colors} />
          <MetaItem icon={<Calendar size={20} color={colors.textTertiary} />} label="Date" value={formatDateRange(event.startAt, event.endAt)} colorScheme={colors} />
          <MetaItem icon={<Clock size={20} color={colors.textTertiary} />} label="Registration Deadline" value={formatDate(event.registrationDeadline)} colorScheme={colors} />
          {event.capacity && (
            <MetaItem icon={<Users size={20} color={colors.textTertiary} />} label="Capacity" value={`${event.capacity} people`} colorScheme={colors} />
          )}
          {event.registrationFee > 0 && (
            <MetaItem icon={<DollarSign size={20} color={colors.textTertiary} />} label="Fee" value={`KES ${formatCurrency(event.registrationFee)}`} colorScheme={colors} />
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>
        </View>

        {/* Eligibility */}
        {event.eligibility && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Eligibility</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{event.eligibility}</Text>
          </View>
        )}

        {/* Organizer */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Organizer</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{event.createdByName}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionCard, { backgroundColor: colors.surface }]}>
        {isRegistered ? (
          <View style={styles.registeredState}>
            <Text style={[styles.registeredText, { color: colors.success }]}>✓ Registered</Text>
            <Text style={[styles.registeredSubtext, { color: colors.textSecondary }]}>
              You are registered for this event
            </Text>
            {canCancel && (
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.errorContainer, borderColor: colors.error }]}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Registration'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: canRegister ? colors.primary : colors.border },
            ]}
            onPress={handleRegister}
            disabled={!canRegister || registrationMutation.isPending}
            activeOpacity={0.8}
          >
            {registrationMutation.isPending ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[
                styles.registerButtonText,
                { color: canRegister ? colors.onPrimary : colors.textTertiary },
              ]}>
                {canRegister ? 'Register for Event' : getDisabledReason()}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!canRegister && !isRegistered && (
          <Text style={[styles.disabledReason, { color: colors.textTertiary }]}>{getDisabledReason()}</Text>
        )}
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string, colors: ColorPalette): string {
  switch (status) {
    case 'published': return colors.success;
    case 'draft': return colors.warning;
    case 'cancelled': return colors.error;
    case 'completed': return colors.info;
    case 'archived': return colors.textTertiary;
    default: return colors.textTertiary;
  }
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getDisabledReason(): string {
  // This would check event status in real implementation
  return 'Registration not available';
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) {
    return `${startDate.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })} • ${startDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE').format(amount);
}

function MetaItem({ icon, label, value, colorScheme }: { icon: React.ReactNode; label: string; value: string; colorScheme: ColorPalette }) {
  return (
    <View style={styles.metaItem}>
      <View style={styles.metaIcon}>{icon}</View>
      <View style={styles.metaTextContainer}>
        <Text style={[styles.metaLabel, { color: colorScheme.textTertiary }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: colorScheme.textPrimary }]}>{value}</Text>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  infoCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  pinBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  metaGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  metaIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  section: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.md,
    lineHeight: 24,
  },
  actionCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  registeredState: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  registeredText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  registeredSubtext: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  registerButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  disabledReason: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: Typography.sizes.sm,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notFoundTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});