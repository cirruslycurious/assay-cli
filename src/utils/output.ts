/**
 * Output formatting utilities
 */

import chalk from 'chalk';
import * as yaml from 'yaml';
import { loadConfig } from './config';

export type OutputFormat = 'json' | 'table' | 'yaml';

/**
 * Format output based on config
 */
export function formatOutput(data: any): string {
  const config = loadConfig();
  const format = config.outputFormat || 'json';

  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      return yaml.stringify(data);
    case 'table':
      return formatTable(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Format data as table (simplified)
 */
function formatTable(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return 'No results';
    }

    // Simple table format for arrays
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(h => String(item[h] || '')));

    // Calculate column widths
    const widths = headers.map((h, i) => {
      const headerWidth = h.length;
      const contentWidth = Math.max(...rows.map(r => r[i].length));
      return Math.max(headerWidth, contentWidth, 10);
    });

    // Build table
    const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');
    const separator = widths.map(w => '-'.repeat(w)).join('-|-');
    const dataRows = rows.map(row => row.map((cell, i) => cell.padEnd(widths[i])).join(' | '));

    return [headerRow, separator, ...dataRows].join('\n');
  }

  // For objects, just show key-value pairs
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green(`✅ ${message}`));
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.error(chalk.red(`❌ ${message}`));
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.warn(chalk.yellow(`⚠️  ${message}`));
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.log(chalk.blue(`ℹ️  ${message}`));
}

