#!/usr/bin/env node

/**
 * Assay CLI - Command-line interface for Assay document library
 */

import { Command } from 'commander';
import { createLoginCommand, createStatusCommand, createRotateCommand } from './commands/auth';
import { createListCommand, createGetCommand, createSearchCommand, createSummaryCommand } from './commands/documents';
import { createThemesListCommand } from './commands/themes';

const program = new Command();

program
  .name('assay')
  .description('CLI for Assay document library')
  .version('1.0.0');

// Auth commands
const authCommand = new Command('auth')
  .description('Authentication and API key management');

authCommand.addCommand(createLoginCommand());
authCommand.addCommand(createStatusCommand());
authCommand.addCommand(createRotateCommand());

program.addCommand(authCommand);

// Document commands
const documentsCommand = new Command('documents')
  .alias('docs')
  .description('Document operations');

documentsCommand.addCommand(createListCommand());
documentsCommand.addCommand(createGetCommand());
documentsCommand.addCommand(createSummaryCommand());
documentsCommand.addCommand(createSearchCommand());

program.addCommand(documentsCommand);

// Theme commands
const themesCommand = new Command('themes')
  .description('Theme operations');

themesCommand.addCommand(createThemesListCommand());

program.addCommand(themesCommand);

// Parse arguments
program.parse();

