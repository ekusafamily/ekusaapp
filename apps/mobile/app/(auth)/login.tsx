/**
 * EKUSA Mobile App - Login Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, isLoading } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await login(identifier, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (
        err?.response?.status === 401 ||
        err?.status === 401 ||
        err?.response?.data?.statusCode === 401 ||
        err?.message?.includes('401') ||
        err?.message?.includes('Invalid credentials')
      ) {
        setError('Wrong password or username. Please check your credentials and try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Sign in to access your account</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Username or Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Enter your username or email"
              placeholderTextColor={colors.textTertiary}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoComplete="username"
              returnKeyType="next"
              textContentType="username"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Password</Text>
              <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              returnKeyType="go"
              textContentType="password"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  forgotPasswordButton: {
    padding: Spacing.xs,
  },
  forgotPasswordText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  registerText: {
    fontSize: Typography.sizes.md,
  },
  registerLink: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});