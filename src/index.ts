import { program } from 'commander';
import chalk from 'chalk';
import { createInstituteApp } from './commands/create.js';
import { initConfig } from './commands/init.js';
import { deploy } from './commands/deploy.js';
import { validateConfig } from './commands/validate.js';

program
  .name('create-institute-app')
  .description(
    'CLI tool to scaffold and deploy a new institute deployment from the LCI Platform template',
  )
  .version('0.1.0');

program
  .command('create')
  .description('Create a new institute project from template')
  .argument('[directory]', 'Target directory for the new project')
  .option('-n, --name <name>', 'Institution name')
  .option('-s, --slug <slug>', 'Tenant slug (URL-safe identifier)')
  .option('-c, --currency <currency>', 'Default currency (default: GHS)')
  .option('--cloud', 'Deploy to cloud (Abdac-hosted) instead of on-premise')
  .option('--skip-install', 'Skip dependency installation')
  .option('--skip-git', 'Skip git initialization')
  .action(createInstituteApp);

program
  .command('init')
  .description('Initialize tenant configuration in an existing project')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initConfig);

program
  .command('deploy')
  .description('Deploy the institute to target environment')
  .argument('<environment>', 'Target environment (on-prem|cloud|docker)')
  .option('--config <path>', 'Path to tenant config file')
  .action(deploy);

program
  .command('validate')
  .description('Validate tenant configuration')
  .argument(
    '[config]',
    'Path to tenant config file (default: tenant.config.yaml)',
  )
  .action(validateConfig);

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
