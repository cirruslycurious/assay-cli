/**
 * Configuration file management
 */

import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { chmodSync } from 'fs';
import type { Config } from '../types/config';

const SERVICE_NAME = 'assay-cli';
const KEY_NAME = 'api-key-secret';

/**
 * Get config directory path (cross-platform)
 */
export function getConfigDir(): string {
  if (process.env.ASSAY_CONFIG_DIR) {
    return process.env.ASSAY_CONFIG_DIR;
  }

  if (process.platform === 'win32') {
    return join(process.env.APPDATA || process.env.LOCALAPPDATA || '', 'assay');
  }

  return join(homedir(), '.assay');
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

/**
 * Load config from file
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();
  
  if (!existsSync(configPath)) {
    // Return default config
    return {
      baseUrl: 'https://us-east4-pdfsummaries.cloudfunctions.net/api',
      outputFormat: 'json',
    };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save config to file
 */
export function saveConfig(config: Config): void {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  // Write config file
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  // Set secure permissions on Unix (chmod 600)
  if (process.platform !== 'win32') {
    try {
      chmodSync(configPath, 0o600);
    } catch (error) {
      // Ignore chmod errors (may not have permission)
    }
  }
}

/**
 * Get service name for keychain
 */
export function getKeychainServiceName(): string {
  return SERVICE_NAME;
}

/**
 * Get key name for keychain
 */
export function getKeychainKeyName(): string {
  return KEY_NAME;
}

