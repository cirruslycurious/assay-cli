/**
 * API Client with retry logic and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import chalk from 'chalk';
import { loadConfig } from './config';
import { getApiKeySecret } from './keychain';

const BASE_URL = 'https://api.assay.cirrusly-clever.com';

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get API key from config/keychain/env
 */
async function getApiKey(): Promise<string | null> {
  // Check environment variable first
  if (process.env.ASSAY_API_KEY) {
    return process.env.ASSAY_API_KEY;
  }

  // Load config
  const config = loadConfig();
  if (!config.keyId) {
    return null;
  }

  // Get secret from keychain
  const keySecret = await getApiKeySecret();
  if (!keySecret) {
    return null;
  }

  // Construct full API key
  return `ask_live_${config.keyId}_${keySecret}`;
}

/**
 * Check if API key is expired or expiring soon
 */
function checkExpiration(expiresAt?: string): { expired: boolean; expiringSoon: boolean; message?: string } {
  if (!expiresAt) {
    return { expired: false, expiringSoon: false };
  }

  const expires = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expires - now;
  const thirtyMinutes = 30 * 60 * 1000;

  if (diff <= 0) {
    return {
      expired: true,
      expiringSoon: false,
      message: chalk.red("❌ API key expired. Run 'assay auth login' to generate a new key."),
    };
  }

  if (diff < thirtyMinutes) {
    const minutes = Math.floor(diff / (60 * 1000));
    return {
      expired: false,
      expiringSoon: true,
      message: chalk.yellow(`⚠️  Warning: API key expires in ${minutes} minutes. Run 'assay auth login' to refresh.`),
    };
  }

  return { expired: false, expiringSoon: false };
}

/**
 * Create API client instance
 */
export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Add API key and check expiration
  client.interceptors.request.use(async (config) => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error("No API key found. Run 'assay auth login' to authenticate.");
    }

    // Check expiration from config
    const appConfig = loadConfig();
    const expirationCheck = checkExpiration(appConfig.apiKeyExpiresAt);

    if (expirationCheck.expired) {
      throw new Error(expirationCheck.message || 'API key expired');
    }

    if (expirationCheck.expiringSoon && expirationCheck.message) {
      console.warn(expirationCheck.message);
    }

    config.headers['X-API-Key'] = apiKey;
    return config;
  });

  // Response interceptor: Handle rate limits with retry
  client.interceptors.response.use(
    (response) => {
      // Update expiration from headers if present
      const expiresAt = response.headers['x-api-key-expires-at'];
      if (expiresAt) {
        const config = loadConfig();
        config.apiKeyExpiresAt = typeof expiresAt === 'string' ? expiresAt : String(expiresAt);
        // Note: We'd need to save config here, but that's handled elsewhere
      }
      return response;
    },
    async (error: AxiosError) => {
      // Handle rate limiting with retry
      if (error.response?.status === 429) {
        const resetHeader = error.response.headers['x-ratelimit-reset'];
        const resetTime = resetHeader ? parseInt(resetHeader) * 1000 : Date.now() + 60000;
        const waitMs = Math.max(Math.min(resetTime - Date.now(), 60000), 1000);

        // Get retry count from config
        const retryCount = (error.config as any)?.['__retryCount'] || 0;
        if (retryCount < 3) {
          (error.config as any)['__retryCount'] = retryCount + 1;
          console.warn(chalk.yellow(`Rate limited. Retrying in ${Math.ceil(waitMs / 1000)}s...`));
          await sleep(waitMs);
          return client.request(error.config!);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Format error message from API response
 */
export function formatError(error: AxiosError): string {
  // Log full error for debugging
  if (process.env.DEBUG) {
    console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
  }

  if (error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as any;
    if (data.error) {
      const errorCode = data.error.code;
      const message = data.error.message;
      const details = data.error.details;

      switch (errorCode) {
        case 'API_KEY_EXPIRED':
          return chalk.red(`❌ API key expired. Run 'assay auth login' to generate a new key.`);
        case 'API_KEY_INVALID':
          return chalk.red(`❌ Invalid API key. Run 'assay auth login' to authenticate.`);
        case 'API_KEY_REVOKED':
          return chalk.red(`❌ API key has been revoked. Run 'assay auth login' to generate a new key.`);
        case 'RATE_LIMIT_EXCEEDED':
          const resetAt = details?.resetAt ? new Date(details.resetAt).toLocaleString() : 'soon';
          return chalk.red(`❌ Rate limit exceeded. Quota resets ${resetAt}.`);
        case 'DOCUMENT_NOT_FOUND':
          return chalk.red(`❌ Document not found. Check the document ID.`);
        case 'INVALID_PARAMETERS':
          return chalk.red(`❌ Invalid parameters: ${message}`);
        case 'PERMISSION_DENIED':
          return chalk.red(`❌ Permission denied: ${message}`);
        case 'INTERNAL_ERROR':
          return chalk.red(`❌ Internal server error: ${message || 'Please try again later.'}`);
        default:
          // Show the actual error message from the API
          return chalk.red(`❌ Error: ${message || errorCode || 'Unknown error'}`);
      }
    }
  }

  // Handle network errors or other axios errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return chalk.red(`❌ Connection error: Could not reach the API. Please check your internet connection.`);
  }

  if (error.message) {
    return chalk.red(`❌ ${error.message}`);
  }

  return chalk.red('❌ An unexpected error occurred');
}

