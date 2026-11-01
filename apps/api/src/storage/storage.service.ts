/**
 * EKUSA Digital Platform - Supabase Storage Service
 * Handles file uploads, signed URLs, and bucket management using Supabase Storage
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private defaultBucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      this.logger.warn('Supabase URL or Service Role Key not configured. Storage operations will be mocked.');
    }

    this.supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', serviceRoleKey || 'placeholder-key');
    this.defaultBucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'ekusa-storage';
  }

  async uploadFile(
    bucket: string,
    path: string,
    fileBuffer: Buffer,
    mimetype: string,
    isPrivate: boolean = false
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, fileBuffer, {
          contentType: mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Failed to upload file to Supabase Storage: ${error.message}`);
        throw new BadRequestException(`Storage upload failed: ${error.message}`);
      }

      return data.path;
    } catch (err: any) {
      this.logger.error(`Storage upload exception: ${err.message}`);
      throw new BadRequestException(`Storage upload failed: ${err.message}`);
    }
  }

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async getSignedUrl(bucket: string, path: string, expiresInSeconds: number = 300): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new BadRequestException(`Failed to access private file: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) {
      this.logger.error(`Failed to delete file from storage: ${error.message}`);
    }
  }
}