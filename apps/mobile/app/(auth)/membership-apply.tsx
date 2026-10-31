/**
 * EKUSA Mobile App - Membership Application Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Picker } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { membershipApi } from '@ekusa/api-client';
import { router } from 'expo-router';
import { submitMembershipRequestSchema } from '@ekusa/validation';

const CAMPUSES = ['Embu Main Campus', 'Kirinyaga Campus', 'Nairobi Campus', 'Other'];
const COURSES = [
  'Bachelor of Education',
  'Bachelor of Science',
  'Bachelor of Arts',
  'Bachelor of Commerce',
  'Bachelor of Computer Science',
  'Bachelor of Nursing',
  'Diploma in Education',
  'Diploma in Business',
  'Other',
];

export default function MembershipApplyScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    registrationNumber: '',
    campus: '',
    course: '',
    yearOfStudy: '',
    contactInfo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateField = (name: string, value: string) => {
    const fieldSchema = submitMembershipRequestSchema.shape[name as keyof typeof submitMembershipRequestSchema.shape];
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
    const result = submitMembershipRequestSchema.safeParse({
      registrationNumber: formData.registrationNumber,
      campus: formData.campus,
      course: formData.course,
      yearOfStudy: parseInt(formData.yearOfStudy, 10) || 1,
      contactInfo: formData.contactInfo || undefined,
    });
    if (!result.success) {
      result.error.errors.forEach(e => {
        newErrors[e.path[0] as string] = e.message;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await membershipApi.apply({
        registrationNumber: formData.registrationNumber,
        campus: formData.campus,
        course: formData.course,
        yearOfStudy: parseInt(formData.yearOfStudy, 10),
        contactInfo: formData.contactInfo || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Application failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.brandContainer}>
            <View style={[styles.logo, { backgroundColor: colors.success }]}>
              <Text style={styles.logoText}>✓</Text>
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>EKUSA Digital Platform</Text>
          </View>

          <View style={styles.successContainer}>
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Application Submitted!</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              Your membership application has been submitted for review.
              You will receive a notification once it's processed.
            </Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              Current status: <Text style={{ fontWeight: Typography.weights.semibold, color: colors.warning }}>Pending Verification</Text>
            </Text>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.replace('/(tabs)/profile')}
            >
              <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Go to Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>← Back</Text>
        </TouchableOpacity>

        {/* Logo/Brand */}
        <View style={styles.brandContainer}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>EKUSA Membership</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Apply for verified membership</Text>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={[styles.infoCard, { backgroundColor: colors.infoContainer }]}>
            <Text style={[styles.infoTitle, { color: colors.info }]}>ℹ️ Verification Required</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Verified members get access to exclusive announcements, events, welfare support,
              and community groups. Applications are reviewed by the Membership Officer.
            </Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Student Registration Number *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.registrationNumber ? colors.error : colors.border },
              ]}
              placeholder="e.g., EKU/2021/12345"
              placeholderTextColor={colors.textTertiary}
              value={formData.registrationNumber}
              onChangeText={v => handleChange('registrationNumber', v)}
              autoCapitalize="characters"
              returnKeyType="next"
            />
            {errors.registrationNumber && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.registrationNumber}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Campus *</Text>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: colors.surface, borderColor: errors.campus ? colors.error : colors.border },
            ]}>
              <Picker
                selectedValue={formData.campus}
                onValueChange={(v) => handleChange('campus', v)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Select Campus" value="" />
                {CAMPUSES.map(campus => (
                  <Picker.Item key={campus} label={campus} value={campus} />
                ))}
              </Picker>
            </View>
            {errors.campus && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.campus}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Course / Program *</Text>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: colors.surface, borderColor: errors.course ? colors.error : colors.border },
            ]}>
              <Picker
                selectedValue={formData.course}
                onValueChange={(v) => handleChange('course', v)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Select Course" value="" />
                {COURSES.map(course => (
                  <Picker.Item key={course} label={course} value={course} />
                ))}
              </Picker>
            </View>
            {errors.course && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.course}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Year of Study *</Text>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: colors.surface, borderColor: errors.yearOfStudy ? colors.error : colors.border },
            ]}>
              <Picker
                selectedValue={formData.yearOfStudy}
                onValueChange={(v) => handleChange('yearOfStudy', v)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Select Year" value="" />
                {[1, 2, 3, 4, 5, 6].map(year => (
                  <Picker.Item key={year} label={`Year ${year}`} value={year.toString()} />
                ))}
              </Picker>
            </View>
            {errors.yearOfStudy && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.yearOfStudy}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Contact Information (optional)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Phone, email, or other contact details"
              placeholderTextColor={colors.textTertiary}
              value={formData.contactInfo}
              onChangeText={v => handleChange('contactInfo', v)}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Requirements */}
        <View style={[styles.requirementsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.requirementsTitle, { color: colors.textPrimary }]}>What happens next?</Text>
          <RequirementItem text="Your application is sent to the Membership Officer for review" colorScheme={colors} />
          <RequirementItem text="You'll receive an in-app notification once reviewed" colorScheme={colors} />
          <RequirementItem text="If approved, you'll get Verified Member status immediately" colorScheme={colors} />
          <RequirementItem text="If rejected, you'll receive a reason and can resubmit" colorScheme={colors} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RequirementItem({ text, colorScheme }: { text: string; colorScheme: typeof Colors.light }) {
  return (
    <View style={styles.requirementRow}>
      <View style={[styles.requirementDot, { backgroundColor: colorScheme.primary }]} />
      <Text style={[styles.requirementText, { color: colorScheme.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  appName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 280,
  },
  infoContainer: {
    marginBottom: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    width: '100%',
    color: colors.textPrimary,
  },
  fieldError: {
    fontSize: Typography.sizes.xs,
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  secondaryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  requirementsCard: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  requirementsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  requirementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  requirementText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  successText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
});