/**
 * Document commands
 */

import { Command } from 'commander';
import { createApiClient, formatError } from '../utils/apiClient';
import { formatOutput, printError } from '../utils/output';
import axios from 'axios';

/**
 * List documents command
 */
export function createListCommand(): Command {
  return new Command('list')
    .description('List documents with pagination')
    .option('-f, --filter <type>', 'Document filter: public, personal, or private (default: public)', 'public')
    .option('-v, --visibility <type>', '[DEPRECATED] Use --filter instead. Document visibility (private, public, all)', 'private')
    .option('-l, --limit <number>', 'Maximum results per page', '20')
    .option('-c, --cursor <cursor>', 'Pagination cursor from previous response')
    .action(async (options) => {
      try {
        const client = createApiClient();
        const params: any = {
          filter: options.filter || options.visibility, // Support both new and legacy flags
          limit: parseInt(options.limit),
        };
        if (options.cursor) {
          params.cursor = options.cursor;
        }

        const response = await client.get('/api/v1/documents', { params });
        console.log(formatOutput(response.data));
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          printError(formatError(error));
        } else {
          printError(error instanceof Error ? error.message : 'Failed to list documents');
        }
        process.exit(1);
      }
    });
}

/**
 * Get document command
 */
export function createGetCommand(): Command {
  return new Command('get')
    .description('Get document details')
    .argument('<documentId>', 'Document ID')
    .action(async (documentId: string) => {
      try {
        const client = createApiClient();
        const response = await client.get(`/api/v1/documents/${documentId}`);
        console.log(formatOutput(response.data));
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          printError(formatError(error));
        } else {
          printError(error instanceof Error ? error.message : 'Failed to get document');
        }
        process.exit(1);
      }
    });
}

/**
 * Get document summary command
 */
export function createSummaryCommand(): Command {
  return new Command('summary')
    .description('Get document summary')
    .argument('<documentId>', 'Document ID')
    .option('-t, --type <type>', 'Summary type: comprehensive, casual, or faq', 'comprehensive')
    .action(async (documentId: string, options) => {
      try {
        const client = createApiClient();
        const params: any = {};
        if (options.type) {
          params.type = options.type;
        }

        const response = await client.get(`/api/v1/documents/${documentId}/summary`, { params });
        console.log(formatOutput(response.data));
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          printError(formatError(error));
        } else {
          printError(error instanceof Error ? error.message : 'Failed to get document summary');
        }
        process.exit(1);
      }
    });
}

/**
 * Search documents command
 */
export function createSearchCommand(): Command {
  return new Command('search')
    .description('Search documents')
    .option('-q, --query <query>', 'General search query')
    .option('-t, --theme <theme>', 'Canonical theme ID')
    .option('-a, --author <author>', 'Author name')
    .option('--title <title>', 'Document title')
    .option('--keywords <keywords>', 'Keywords or concepts')
    .option('-f, --filter <type>', 'Document filter: public, personal, or private (default: public)', 'public')
    .option('-v, --visibility <type>', '[DEPRECATED] Use --filter instead. Document visibility (private, public, all)', 'private')
    .option('-l, --limit <number>', 'Maximum results', '20')
    .action(async (options) => {
      try {
        const client = createApiClient();
        const params: any = {
          filter: options.filter || options.visibility, // Support both new and legacy flags
          limit: parseInt(options.limit),
        };
        if (options.query) params.q = options.query;
        if (options.theme) params.theme = options.theme;
        if (options.author) params.author = options.author;
        if (options.title) params.title = options.title;
        if (options.keywords) params.keywords = options.keywords;

        const response = await client.get('/api/v1/documents/search', { params });
        console.log(formatOutput(response.data));
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          // Log full error for debugging
          if (error.response?.data) {
            console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
          }
          printError(formatError(error));
        } else {
          printError(error instanceof Error ? error.message : 'Failed to search documents');
        }
        process.exit(1);
      }
    });
}

