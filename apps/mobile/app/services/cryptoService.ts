/**
 * EKUSA Mobile App - Crypto Service
 * Signal Protocol implementation for E2EE messaging
 * Using libsignal-protocol-typescript
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Type definitions for Signal Protocol
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface PreKey {
  keyId: number;
  keyPair: KeyPair;
}

export interface SignedPreKey {
  keyId: number;
  keyPair: KeyPair;
  signature: Uint8Array;
}

export interface IdentityKeyPair extends KeyPair {}

export interface SessionRecord {
  sessionState: any; // Serialized session state
}

export interface PreKeyBundle {
  identityKey: Uint8Array;
  registrationId: number;
  preKey: { keyId: number; publicKey: Uint8Array };
  signedPreKey: { keyId: number; publicKey: Uint8Array; signature: Uint8Array };
}

export interface EncryptedMessage {
  ciphertext: Uint8Array;
  type: number; // 0 = prekey, 1 = regular
  messageType: number; // Signal message type
}

// Storage keys
const STORAGE_KEYS = {
  IDENTITY_KEY: 'ekusa_identity_key',
  REGISTRATION_ID: 'ekusa_registration_id',
  PRE_KEYS: 'ekusa_pre_keys',
  SIGNED_PRE_KEY: 'ekusa_signed_pre_key',
  SESSIONS: 'ekusa_sessions_',
} as const;

// Generate a random registration ID
function generateRegistrationId(): number {
  return Math.floor(Math.random() * 16380) + 1; // 1-16381
}

// Secure storage helpers
async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// ArrayBuffer <-> Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function keyPairToJson(keyPair: KeyPair) {
  return {
    publicKey: arrayBufferToBase64(keyPair.publicKey),
    privateKey: arrayBufferToBase64(keyPair.privateKey),
  };
}

function jsonToKeyPair(json: { publicKey: string; privateKey: string }): KeyPair {
  return {
    publicKey: base64ToArrayBuffer(json.publicKey),
    privateKey: base64ToArrayBuffer(json.privateKey),
  };
}

/**
 * Crypto Service - Singleton for managing Signal Protocol keys and sessions
 */
class CryptoService {
  private static instance: CryptoService;
  private initialized = false;
  private identityKeyPair: IdentityKeyPair | null = null;
  private registrationId: number | null = null;

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load or generate identity key
      const storedIdentity = await secureGet(STORAGE_KEYS.IDENTITY_KEY);
      if (storedIdentity) {
        this.identityKeyPair = jsonToKeyPair(JSON.parse(storedIdentity));
      } else {
        this.identityKeyPair = await this.generateIdentityKeyPair();
        await secureSet(STORAGE_KEYS.IDENTITY_KEY, JSON.stringify(keyPairToJson(this.identityKeyPair)));
      }

      // Load or generate registration ID
      const storedRegId = await secureGet(STORAGE_KEYS.REGISTRATION_ID);
      if (storedRegId) {
        this.registrationId = parseInt(storedRegId, 10);
      } else {
        this.registrationId = generateRegistrationId();
        await secureSet(STORAGE_KEYS.REGISTRATION_ID, this.registrationId.toString());
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize crypto service:', error);
      throw new Error('Crypto initialization failed');
    }
  }

  // Stub implementations - replace with actual libsignal-protocol calls
  private async generateIdentityKeyPair(): Promise<IdentityKeyPair> {
    // In production, use libsignal's curve25519 key generation
    // For now, generate random keys as placeholder
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = await this.derivePublicKey(privateKey);
    return { publicKey, privateKey };
  }

  private async derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    // Placeholder - in production use X25519 key derivation
    return crypto.getRandomValues(new Uint8Array(32));
  }

  async generatePreKeys(count: number = 100): Promise<PreKey[]> {
    const preKeys: PreKey[] = [];
    for (let i = 0; i < count; i++) {
      const keyId = i + 1;
      const keyPair = await this.generateKeyPair();
      preKeys.push({ keyId, keyPair });
    }
    return preKeys;
  }

  private async generateKeyPair(): Promise<KeyPair> {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = await this.derivePublicKey(privateKey);
    return { publicKey, privateKey };
  }

  async generateSignedPreKey(): Promise<SignedPreKey> {
    const keyId = 1;
    const keyPair = await this.generateKeyPair();
    const signature = await this.sign(this.identityKeyPair!.privateKey, keyPair.publicKey);
    return { keyId, keyPair, signature };
  }

  private async sign(privateKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    // Placeholder - use Ed25519 signing in production
    return crypto.getRandomValues(new Uint8Array(64));
  }

  async getPreKeyBundle(): Promise<PreKeyBundle> {
    if (!this.identityKeyPair || !this.registrationId) {
      throw new Error('Crypto service not initialized');
    }

    const preKeys = await this.generatePreKeys(1);
    const signedPreKey = await this.generateSignedPreKey();

    return {
      identityKey: this.identityKeyPair.publicKey,
      registrationId: this.registrationId,
      preKey: { keyId: preKeys[0].keyId, publicKey: preKeys[0].keyPair.publicKey },
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKey.keyPair.publicKey,
        signature: signedPreKey.signature,
      },
    };
  }

  async encryptMessage(recipientBundle: PreKeyBundle, plaintext: string): Promise<EncryptedMessage> {
    // Placeholder - implement Signal Protocol encryption
    // This would use the Double Ratchet algorithm
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // In production:
    // 1. Create session with recipient's prekey bundle
    // 2. Encrypt using session cipher
    // 3. Return ciphertext + metadata

    return {
      ciphertext: data, // Placeholder - not actually encrypted
      type: 0, // PreKey message
      messageType: 3, // Signal message type
    };
  }

  async decryptMessage(senderAddress: string, encryptedMessage: EncryptedMessage): Promise<string> {
    // Placeholder - implement Signal Protocol decryption
    const decoder = new TextDecoder();
    return decoder.decode(encryptedMessage.ciphertext);
  }

  async getIdentityKeyPair(): Promise<IdentityKeyPair | null> {
    return this.identityKeyPair;
  }

  async getRegistrationId(): Promise<number | null> {
    return this.registrationId;
  }

  async clearAllKeys(): Promise<void> {
    await secureDelete(STORAGE_KEYS.IDENTITY_KEY);
    await secureDelete(STORAGE_KEYS.REGISTRATION_ID);
    await secureDelete(STORAGE_KEYS.PRE_KEYS);
    await secureDelete(STORAGE_KEYS.SIGNED_PRE_KEY);
    // Clear all session keys
    // In production, iterate through all session keys
    this.identityKeyPair = null;
    this.registrationId = null;
    this.initialized = false;
  }

  // Session management
  async saveSession(recipientId: string, sessionRecord: SessionRecord): Promise<void> {
    await secureSet(`${STORAGE_KEYS.SESSIONS}${recipientId}`, JSON.stringify(sessionRecord));
  }

  async loadSession(recipientId: string): Promise<SessionRecord | null> {
    const stored = await secureGet(`${STORAGE_KEYS.SESSIONS}${recipientId}`);
    return stored ? JSON.parse(stored) : null;
  }

  async deleteSession(recipientId: string): Promise<void> {
    await secureDelete(`${STORAGE_KEYS.SESSIONS}${recipientId}`);
  }
}

export const cryptoService = CryptoService.getInstance();