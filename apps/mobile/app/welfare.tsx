/**
 * EKUSA Mobile App - Welfare Screen
 * Submit and track welfare requests
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { welfareApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import type { ColorPalette } from '@/constants/DesignTokens';
import { router } from 'expo-router';
import { submitWelfareRequestSchema } from '@ekusa/validation';
import { Plus, X, ChevronRight } from 'lucide-react-native';

const CATEGORIES = [
  { value: 'personal', label: 'Personal Welfare' },
  { value: 'emergency', label: 'Emergency Assistance' },
  { value: 'academic', label: 'Academic Concerns' },
  { value: 'accommodation', label: 'Accommodation Concerns' },
  { value: 'financial', label: 'Financial Assistance' },
  { value: 'general', label: 'General Student Support' },
  { value: 'other', label: 'Other' },
];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  awaiting_information: 'Awaiting Information',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLOR_KEYS: Record<string, keyof ColorPalette> = {
  submitted: 'warning',
  under_review: 'info',
  in_progress: 'primary',
  awaiting_information: 'primaryDark',
  resolved: 'success',
  closed: 'textTertiary',
};

export default function WelfareScreen() {
  const { user } = useAuthStore();
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['welfare-requests', 'me'],
    queryFn: () => welfareApi.getMyRequests({}),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => welfareApi.submit(data),
    onSuccess: () => {
      setShowForm(false);
      setFormData({ category: '', subject: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['welfare-requests', 'me'] });
      Alert.alert('Success', 'Welfare request submitted successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit request');
    },
  });

  const validateField = (name: string, value: string) => {
    const fieldSchema = submitWelfareRequestSchema.shape[name as keyof typeof submitWelfareRequestSchema.shape];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0].message;
      }
    }
    return '';
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const fieldError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const result = submitWelfareRequestSchema.safeParse({
      category: formData.category,
      subject: formData.subject,
      description: formData.description,
    });
    if (!result.success) {
      result.error.errors.forEach(e => {
        newErrors[e.path[0] as string] = e.message;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    submitMutation.mutate(formData);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Text style={[styles.authPromptTitle, { color: colors.textPrimary }]}>Sign in to access welfare</Text>
          <Text style={[styles.authPromptText, { color: colors.textSecondary }]}>You need to be logged in to submit and track welfare requests.</Text>
          <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.loginButtonText, { color: colors.onPrimary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Welfare Support</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Submit and track your welfare requests confidentially
          </Text>
        </View>

        {/* Submit Button / Form */}
        {!showForm ? (
          <TouchableOpacity
            style={[styles.submitCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
          >
            <Plus size={22} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.submitCardText, { color: colors.textPrimary }]}>Submit New Request</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>New Welfare Request</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Category *</Text>
              <TouchableOpacity
                style={[
                  styles.pickerContainer,
                  { backgroundColor: colors.surface, borderColor: errors.category ? colors.error : colors.border },
                ]}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerText, { color: formData.category ? colors.textPrimary : colors.textTertiary }]}>
                  {formData.category ? CATEGORIES.find(c => c.value === formData.category)?.label : 'Select Category'}
                </Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              {errors.category && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.category}</Text>}
              <Modal
                visible={categoryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCategoryModalVisible(false)}
              >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
                  <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Category</Text>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[styles.modalOption, { borderBottomColor: colors.border }]}
                        onPress={() => { handleChange('category', cat.value); setCategoryModalVisible(false); }}
                      >
                        <Text style={[styles.modalOptionText, {
                          color: formData.category === cat.value ? colors.primary : colors.textPrimary,
                          fontWeight: formData.category === cat.value ? Typography.weights.semibold : Typography.weights.regular,
                        }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Subject *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.subject ? colors.error : colors.border },
                ]}
                placeholder="Brief summary of your request"
                placeholderTextColor={colors.textTertiary}
                value={formData.subject}
                onChangeText={v => handleChange('subject', v)}
                maxLength={200}
              />
              {errors.subject && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.subject}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Description *</Text>
              <TextInput
                style={[
                  styles.textarea,
                  { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.description ? colors.error : colors.border },
                ]}
                placeholder="Describe your request in detail..."
                placeholderTextColor={colors.textTertiary}
                value={formData.description}
                onChangeText={v => handleChange('description', v)}
                multiline
                numberOfLines={6}
                maxLength={5000}
              />
              {errors.description && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.description}</Text>}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowForm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Requests */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Requests</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : requests?.items?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No welfare requests yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Tap "Submit New Request" to create your first request
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests?.items}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => <RequestItem request={item} />}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RequestItem({ request }: { request: any }) {
  const { colors } = useTheme();
  const statusColor = (colors[STATUS_COLOR_KEYS[request.status] ?? ''] as string) || colors.textTertiary;

  return (
    <View style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTitleContainer}>
          <Text style={[styles.requestSubject, { color: colors.textPrimary }]}>{request.subject}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[request.status] || request.status}</Text>
          </View>
        </View>
        <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
          {formatDate(request.createdAt)}
        </Text>
      </View>

      <Text style={[styles.requestDescription, { color: colors.textSecondary }]}>{request.description}</Text>

      {request.assignedOfficerName && (
        <View style={[styles.assignedInfo, { borderTopColor: colors.divider }]}>
          <Text style={[styles.assignedLabel, { color: colors.textTertiary }]}>Assigned to:</Text>
          <Text style={[styles.assignedName, { color: colors.textPrimary }]}>{request.assignedOfficerName}</Text>
        </View>
      )}

      {request.updates && request.updates.length > 0 && (
        <View style={[styles.updatesContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.updatesTitle, { color: colors.textSecondary }]}>Updates</Text>
          {request.updates.map((update: any) => (
            <View key={update.id} style={[styles.updateItem, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.updateAuthor, { color: colors.textSecondary }]}>{update.authorName}</Text>
              <Text style={[styles.updateMessage, { color: colors.textPrimary }]}>{update.message}</Text>
              <Text style={[styles.updateTime, { color: colors.textTertiary }]}>
                {formatDate(update.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
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
    marginBottom: Spacing.lg,
  },
  loginButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  loginButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  header: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  submitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  submitCardText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  pickerText: {
    fontSize: Typography.sizes.md,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  modalOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: Typography.sizes.md,
  },
  fieldError: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  submitButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  listContent: {
    gap: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  requestCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  requestTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  requestSubject: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
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
  requestDate: {
    fontSize: Typography.sizes.xs,
  },
  requestDescription: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  assignedLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  assignedName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  updatesContainer: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  updatesTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  updateItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  updateAuthor: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  updateMessage: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  updateTime: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
});