/**
 * Theme commands
 */

import { Command } from 'commander';
import { createApiClient, formatError } from '../utils/apiClient';
import { formatOutput, printError } from '../utils/output';
import axios from 'axios';

/**
 * List themes command
 */
export function createThemesListCommand(): Command {
  return new Command('list')
    .description('Browse canonical themes')
    .option('-d, --domain <domain>', 'L0 domain ID (e.g., ARTIFICIAL_INTELLIGENCE). If provided, returns L1 themes for that domain.')
    .action(async (options) => {
      try {
        const client = createApiClient();
        const params: any = {};
        if (options.domain) {
          params.domain = options.domain;
        }

        const response = await client.get('/api/v1/themes', { params });
        console.log(formatOutput(response.data));
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          printError(formatError(error));
        } else {
          printError(error instanceof Error ? error.message : 'Failed to list themes');
        }
        process.exit(1);
      }
    });
}

