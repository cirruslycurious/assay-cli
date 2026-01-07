/**
 * OS Keychain management for API key storage
 */

import * as keytar from 'keytar';
import { getKeychainServiceName, getKeychainKeyName } from './config';

let keytarAvailable: boolean | null = null;

/**
 * Check if keytar is available
 */
export async function isKeychainAvailable(): Promise<boolean> {
  if (keytarAvailable !== null) {
    return keytarAvailable;
  }

  try {
    // Try to get a test value to see if keytar works
    await keytar.getPassword(getKeychainServiceName(), 'test');
    keytarAvailable = true;
    return true;
  } catch (error) {
    keytarAvailable = false;
    return false;
  }
}

/**
 * Store API key secret in keychain
 */
export async function storeApiKeySecret(keySecret: string): Promise<void> {
  const available = await isKeychainAvailable();
  if (!available) {
    throw new Error('Keychain not available. Use environment variable ASSAY_API_KEY instead.');
  }

  try {
    await keytar.setPassword(
      getKeychainServiceName(),
      getKeychainKeyName(),
      keySecret
    );
  } catch (error) {
    throw new Error(`Failed to store API key in keychain: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieve API key secret from keychain
 */
export async function getApiKeySecret(): Promise<string | null> {
  const available = await isKeychainAvailable();
  if (!available) {
    return null;
  }

  try {
    return await keytar.getPassword(
      getKeychainServiceName(),
      getKeychainKeyName()
    );
  } catch (error) {
    return null;
  }
}

/**
 * Delete API key secret from keychain
 */
export async function deleteApiKeySecret(): Promise<void> {
  const available = await isKeychainAvailable();
  if (!available) {
    return; // Nothing to delete
  }

  try {
    await keytar.deletePassword(
      getKeychainServiceName(),
      getKeychainKeyName()
    );
  } catch (error) {
    // Ignore errors when deleting
  }
}

