import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {
  loadTenantConfig,
  validateTenantConfig,
  TenantConfig,
} from '../utils/config-loader.js';

export async function validateConfig(configPath?: string) {
  const projectDir = process.cwd();
  const targetPath = configPath || path.join(projectDir, 'tenant.config.yaml');

  if (!(await fs.pathExists(targetPath))) {
    console.error(chalk.red('Configuration file not found:'), targetPath);
    process.exit(1);
  }

  console.log(chalk.bold(`Validating ${targetPath}...\n`));

  try {
    const config = await loadTenantConfig(targetPath);
    const result = validateTenantConfig(config);

    if (result.valid) {
      console.log(chalk.green('✓ Configuration is valid'));
      printConfigSummary(config);
    } else {
      console.log(chalk.red('✗ Configuration has errors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  - ${warning}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('Failed to load configuration:'), error);
    process.exit(1);
  }
}

function printConfigSummary(config: TenantConfig) {
  console.log(chalk.bold('\nConfiguration Summary:'));
  console.log(`  Institution: ${config.name} (${config.slug})`);
  console.log(`  Currency: ${config.currency}`);
  console.log(`  Timezone: ${config.timezone}`);
  console.log(`  Deployment: ${config.deployment}`);
  console.log(
    `  Contact: ${config.contactEmail}${config.contactPhone ? ` / ${config.contactPhone}` : ''}`,
  );

  const activeModules = Object.entries(config.modules)
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  console.log(`\n  Active Modules (${activeModules.length}):`);
  for (const module of activeModules) {
    console.log(`    ✓ ${module}`);
  }

  const inactiveModules = Object.entries(config.modules)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  if (inactiveModules.length > 0) {
    console.log(`\n  Inactive Modules (${inactiveModules.length}):`);
    for (const module of inactiveModules) {
      console.log(`    ✗ ${module}`);
    }
  }
}
