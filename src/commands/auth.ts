/**
 * Authentication commands
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import open from 'open';
import axios from 'axios';
import { loadConfig, saveConfig } from '../utils/config';
import { storeApiKeySecret, getApiKeySecret, deleteApiKeySecret, isKeychainAvailable } from '../utils/keychain';
import { createApiClient, formatError } from '../utils/apiClient';
import { printSuccess, printError, printWarning, printInfo } from '../utils/output';
import chalk from 'chalk';

const DASHBOARD_URL = 'https://assay.cirrusly-clever.com/dashboard';

/**
 * Parse API key format: ask_live_<keyId>_<keySecret>
 */
function parseApiKey(apiKey: string): { keyId: string; keySecret: string } | null {
  if (!apiKey.startsWith('ask_live_')) {
    return null;
  }

  const parts = apiKey.slice(9).split('_');
  if (parts.length < 2) {
    return null;
  }

  return {
    keyId: parts[0],
    keySecret: parts.slice(1).join('_'),
  };
}

/**
 * Test API key by calling /api/v1/me
 */
async function testApiKey(apiKey: string): Promise<{ valid: boolean; expiresAt?: string }> {
  try {
    const response = await axios.get('https://us-east4-pdfsummaries.cloudfunctions.net/api/api/v1/me', {
      headers: { 'X-API-Key': apiKey },
      timeout: 10000,
    });

    if (response.data.success && response.data.data) {
      return {
        valid: true,
        expiresAt: response.data.data.expiresAt,
      };
    }

    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Login command
 */
export function createLoginCommand(): Command {
  return new Command('login')
    .description('Authenticate and generate API key')
    .action(async () => {
      try {
        printInfo('Opening Dashboard to generate API key...');
        await open(DASHBOARD_URL);

        const { apiKey } = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiKey',
            message: 'Paste your API key (ask_live_...):',
            validate: (input: string) => {
              if (!input.startsWith('ask_live_')) {
                return 'Invalid API key format. Must start with "ask_live_"';
              }
              return true;
            },
          },
        ]);

        // Parse API key
        const parsed = parseApiKey(apiKey);
        if (!parsed) {
          printError('Invalid API key format');
          process.exit(1);
        }

        // Test API key
        printInfo('Testing API key...');
        const testResult = await testApiKey(apiKey);
        if (!testResult.valid) {
          printError('API key validation failed. Please check your key and try again.');
          process.exit(1);
        }

        // Store in keychain (if available) or config
        const keychainAvailable = await isKeychainAvailable();
        if (keychainAvailable) {
          await storeApiKeySecret(parsed.keySecret);
          printInfo('API key stored securely in OS keychain');
        } else {
          printWarning('Keychain not available. Storing key in config file (chmod 600).');
          printWarning('For better security, set ASSAY_API_KEY environment variable instead.');
        }

        // Save config
        const config = loadConfig();
        config.keyId = parsed.keyId;
        config.apiKeyExpiresAt = testResult.expiresAt;
        config.baseUrl = 'https://us-east4-pdfsummaries.cloudfunctions.net/api';
        saveConfig(config);

        // If keychain not available, store full key in env var suggestion
        if (!keychainAvailable) {
          printWarning(`\nAlternatively, set environment variable:\n  export ASSAY_API_KEY="${apiKey}"`);
        }

        printSuccess(`API key valid until ${testResult.expiresAt ? new Date(testResult.expiresAt).toLocaleString() : 'unknown'}`);
      } catch (error) {
        printError(error instanceof Error ? error.message : 'Failed to login');
        process.exit(1);
      }
    });
}

/**
 * Status command
 */
export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show API key status and quota information')
    .action(async () => {
      try {
        const config = loadConfig();
        if (!config.keyId) {
          printError("No API key found. Run 'assay auth login' to authenticate.");
          process.exit(1);
        }

        const client = createApiClient();
        const response = await client.get('/api/v1/me');

        if (response.data.success) {
          const data = response.data.data;
          const config = loadConfig();

          console.log(chalk.bold('\nAPI Key Status:'));
          console.log(`  Key ID: ${data.keyId.substring(0, 12)}...${data.keyId.substring(data.keyId.length - 4)}`);
          console.log(`  Status: ${chalk.green('Active')}`);
          console.log(`  Expires: ${new Date(data.expiresAt).toLocaleString()}`);
          console.log(`  Expires In: ${formatTimeRemaining(data.expiresIn)}`);
          console.log(`\nQuota:`);
          console.log(`  Used: ${data.quota.used.toLocaleString()} / ${data.quota.limit.toLocaleString()} (${Math.round((data.quota.used / data.quota.limit) * 100)}%)`);
          console.log(`  Remaining: ${data.quota.remaining.toLocaleString()}`);
          console.log(`  Resets: ${new Date(data.quota.resetAt).toLocaleString()}`);

          if (data.expiresIn < 30 * 60) {
            const minutes = Math.floor(data.expiresIn / 60);
            printWarning(`\nAPI key expires in ${minutes} minutes. Run 'assay auth login' to refresh.`);
          }
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          printError(formatError(error));
        } else {
          printError(error instanceof Error ? error.message : 'Failed to get status');
        }
        process.exit(1);
      }
    });
}

/**
 * Format time remaining
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minutes`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours`;
  }
  return `${Math.floor(seconds / 86400)} days`;
}

/**
 * Rotate command (simplified - opens dashboard)
 */
export function createRotateCommand(): Command {
  return new Command('rotate')
    .description('Rotate API key (opens Dashboard to generate new key)')
    .option('--keep-old', 'Keep old key active (don\'t revoke)')
    .action(async (options) => {
      try {
        printInfo('Opening Dashboard to generate new API key...');
        await open(DASHBOARD_URL);
        printInfo('After generating a new key, run "assay auth login" to update your CLI configuration.');
      } catch (error) {
        printError(error instanceof Error ? error.message : 'Failed to open Dashboard');
        process.exit(1);
      }
    });
}

