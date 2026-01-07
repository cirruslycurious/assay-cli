/**
 * CLI Configuration Types
 */

export interface Config {
  keyId?: string; // Non-secret identifier (stored in config)
  apiKeyExpiresAt?: string; // ISO 8601 timestamp
  baseUrl: string; // API base URL
  outputFormat: 'json' | 'table' | 'yaml'; // Output format
}

export interface ApiKeyInfo {
  apiKey: string; // Full key: ask_live_<keyId>_<keySecret>
  keyId: string;
  expiresAt: string; // ISO 8601
  durationHours: number;
}

