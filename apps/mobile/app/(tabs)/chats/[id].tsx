/**
 * EKUSA Mobile App - Chat Screen
 * Individual conversation view with E2EE messaging
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';
import { cryptoService } from '@/services/cryptoService';
import { storageService } from '@/services/storageService';
import { router, useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id?: string; conversationId?: string }>();
  const conversationId = (params.conversationId || params.id || '') as string;
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const keyboardShown = useRef(false);

  // Load messages from local storage first, then sync with server
  useEffect(() => {
    loadMessages();
    setupRealtimeListener();
    return () => cleanupRealtimeListener();
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      // Load from local storage
      const localMessages = await storageService.getMessages(conversationId);
      setMessages(localMessages.reverse()); // oldest first

      // Fetch from server
      const serverMessages = await queryClient.fetchQuery({
        queryKey: ['messages', conversationId],
        queryFn: () => messagingApi.getConversation(conversationId),
      });

      // Merge and deduplicate
      // In real app, do proper sync
      setIsLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
      setIsLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    // Set up WebSocket listener for new messages
    // In real app, connect to WebSocket gateway
  };

  const cleanupRealtimeListener = () => {
    // Clean up WebSocket
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      // Encrypt message
      const encrypted = await cryptoService.encryptMessage(
        { identityKey: new Uint8Array(), registrationId: 0, preKey: { keyId: 0, publicKey: new Uint8Array() }, signedPreKey: { keyId: 0, publicKey: new Uint8Array(), signature: new Uint8Array() } },
        text
      );

      const ciphertextStr = typeof Buffer !== 'undefined'
        ? Buffer.from(encrypted.ciphertext).toString('base64')
        : btoa(String.fromCharCode(...encrypted.ciphertext));

      return messagingApi.sendMessage({
        conversationId,
        ciphertext: ciphertextStr,
        protocolMetadata: '',
        messageType: 'text',
      }) as Promise<any>;
    },
    onSuccess: (sentMessage: any) => {
      // Update local message status
      setMessages(prev => prev.map(m =>
        m.id === sentMessage?.id ? { ...m, status: 'sent' } : m
      ));
      setIsSending(false);
      scrollToBottom();
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      setIsSending(false);
    },
  });

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      conversationId,
      senderId: user?.id,
      content: text,
      messageType: 'text',
      status: 'pending' as const,
      sentAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    await storageService.saveMessage(tempMessage);
    scrollToBottom();

    // Send encrypted
    sendMessageMutation.mutate(text);
  };

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user?.id;
    const statusColor = item.status === 'read' ? colors.success :
                       item.status === 'delivered' ? colors.success :
                       item.status === 'sent' ? colors.primary :
                       item.status === 'pending' ? colors.warning : colors.error;

    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.messageOwn : styles.messageOther,
      ]}>
        {!isOwn && (
          <Avatar
            source={item.senderAvatar ? { uri: item.senderAvatar } : undefined}
            name={item.senderName}
            size="small"
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.textOwn : styles.textOther,
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, { color: colors.textTertiary }]}>
              {formatTime(item.sentAt)}
            </Text>
            {isOwn && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loadingContainer} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={scrollToBottom}
        onLayout={() => scrollToBottom()}
        contentContainerStyle={styles.listContent}
        inverted
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surfaceVariant, color: colors.textPrimary, borderColor: colors.border },
          ]}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={4000}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            !newMessage.trim() && { opacity: 0.5 },
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || isSending}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={{ color: colors.onPrimary, fontSize: 18 }}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  messageOwn: {
    justifyContent: 'flex-end',
  },
  messageOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: Spacing.xs,
  },
  bubbleOther: {
    backgroundColor: Colors.light.surfaceVariant,
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: Colors.light.textPrimary,
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  messageTime: {
    fontSize: Typography.sizes.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});