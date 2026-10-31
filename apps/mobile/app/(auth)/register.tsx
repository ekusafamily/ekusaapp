/**
 * EKUSA Mobile App - Register Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { router } from 'expo-router';
import { registerRequestSchema } from '@ekusa/validation';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const validateField = (name: string, value: string) => {
    const fieldSchema = registerRequestSchema.shape[name as keyof typeof registerRequestSchema.shape];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0].message;
      }
    }
    if (name === 'confirmPassword') {
      if (value !== formData.password) return 'Passwords do not match';
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
    const result = registerRequestSchema.safeParse({
      username: formData.username,
      email: formData.email || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      password: formData.password,
    });
    if (!result.success) {
      result.error.errors.forEach(e => {
        newErrors[e.path[0] as string] = e.message;
      });
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    try {
      await register({
        username: formData.username,
        email: formData.email || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        password: formData.password,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

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
        {/* Logo/Brand */}
        <View style={styles.brandContainer}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>EKUSA Digital Platform</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Embu Kimathi University Student Association</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Create your account</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Join the EKUSA community today</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Register Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Username</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.username ? colors.error : colors.border },
              ]}
              placeholder="Choose a username"
              placeholderTextColor={colors.textTertiary}
              value={formData.username}
              onChangeText={v => handleChange('username', v)}
              autoCapitalize="none"
              autoCompleteType="username"
              returnKeyType="next"
              textContentType="username"
            />
            {errors.username && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.username}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Email (optional)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.email ? colors.error : colors.border },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
              value={formData.email}
              onChangeText={v => handleChange('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCompleteType="email"
              returnKeyType="next"
              textContentType="email"
            />
            {errors.email && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Phone Number (optional)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.phoneNumber ? colors.error : colors.border },
              ]}
              placeholder="+254 7XX XXX XXX"
              placeholderTextColor={colors.textTertiary}
              value={formData.phoneNumber}
              onChangeText={v => handleChange('phoneNumber', v)}
              keyboardType="phone-pad"
              autoCompleteType="tel"
              returnKeyType="next"
              textContentType="telephoneNumber"
            />
            {errors.phoneNumber && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.password ? colors.error : colors.border },
              ]}
              placeholder="Create a password"
              placeholderTextColor={colors.textTertiary}
              value={formData.password}
              onChangeText={v => handleChange('password', v)}
              secureTextEntry
              autoCompleteType="new-password"
              returnKeyType="next"
              textContentType="newPassword"
            />
            {errors.password && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: errors.confirmPassword ? colors.error : colors.border },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textTertiary}
              value={formData.confirmPassword}
              onChangeText={v => handleChange('confirmPassword', v)}
              secureTextEntry
              autoCompleteType="new-password"
              returnKeyType="go"
              textContentType="newPassword"
              onSubmitEditing={handleRegister}
            />
            {errors.confirmPassword && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.confirmPassword}</Text>}
          </View>

          {/* Password Requirements */}
          <View style={styles.passwordRequirements}>
            <Text style={[styles.requirementsTitle, { color: colors.textSecondary }]}>Password must contain:</Text>
            <RequirementItem met={formData.password.length >= 8} text="At least 8 characters" colorScheme={colors} />
            <RequirementItem met=/[A-Z]/.test(formData.password) text="One uppercase letter" colorScheme={colors} />
            <RequirementItem met=/[a-z]/.test(formData.password) text="One lowercase letter" colorScheme={colors} />
            <RequirementItem met=/[0-9]/.test(formData.password) text="One number" colorScheme={colors} />
            <RequirementItem met=/[^A-Za-z0-9]/.test(formData.password) text="One special character" colorScheme={colors} />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={[styles.termsText, { color: colors.textTertiary }]}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RequirementItem({ met, text, colorScheme }: { met: boolean; text: string; colorScheme: typeof Colors.light }) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={[
          styles.requirementIcon,
          { backgroundColor: met ? colorScheme.success : colorScheme.border },
        ]}
      >
        {met && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.requirementText, { color: met ? colorScheme.success : colorScheme.textTertiary }]}>{text}</Text>
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
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  welcomeSubtitle: {
    fontSize: Typography.sizes.md,
    marginTop: Spacing.xs,
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
  fieldError: {
    fontSize: Typography.sizes.xs,
  },
  passwordRequirements: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  requirementsTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  requirementIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  requirementText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: {
    fontSize: Typography.sizes.md,
  },
  loginLink: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  termsText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
});