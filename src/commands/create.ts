import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts, { PromptObject } from 'prompts';
import ora from 'ora';
import { generateTenantConfig } from '../utils/config-generator.js';
import { copyTemplate } from '../utils/template.js';
import { TemplateOptions } from '../utils/template.js';
import { TenantConfig } from '../utils/config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.resolve(__dirname, '../../templates');

export interface CreateOptions {
  name?: string;
  slug?: string;
  currency?: string;
  cloud?: boolean;
  skipInstall?: boolean;
  skipGit?: boolean;
}

export async function createInstituteApp(
  targetDir: string | undefined,
  options: CreateOptions,
) {
  const spinner = ora('Initializing...').start();

  try {
    // Determine target directory
    const projectDir = targetDir
      ? path.resolve(process.cwd(), targetDir)
      : process.cwd();

    // Check if directory exists and is empty
    if (await fs.pathExists(projectDir)) {
      const files = await fs.readdir(projectDir);
      if (files.length > 0 && !options.skipGit) {
        spinner.fail('Target directory is not empty');
        console.log(
          chalk.yellow('Use --skip-git to initialize in a non-empty directory'),
        );
        process.exit(1);
      }
    }

    // Collect configuration interactively if not provided
    const config = await collectConfig(options);
    spinner.succeed('Configuration collected');

    // Create project structure
    spinner.start('Creating project structure...');
    await fs.ensureDir(projectDir);
    await copyTemplate(TEMPLATE_ROOT, projectDir, config);
    spinner.succeed('Project structure created');

    // Generate tenant configuration
    spinner.start('Generating tenant configuration...');
    await generateTenantConfig(projectDir, config);
    spinner.succeed('Tenant configuration generated');

    // Initialize git if not skipped
    if (!options.skipGit) {
      spinner.start('Initializing git repository...');
      await execa('git', ['init'], { cwd: projectDir });
      await execa('git', ['add', '.'], { cwd: projectDir });
      await execa(
        'git',
        ['commit', '-m', 'chore: initial commit from create-institute-app'],
        { cwd: projectDir },
      );
      spinner.succeed('Git repository initialized');
    }

    // Install dependencies if not skipped
    if (!options.skipInstall) {
      spinner.start('Installing dependencies...');
      await execa('npm', ['install'], { cwd: projectDir, stdio: 'inherit' });
      spinner.succeed('Dependencies installed');
    }

    // Print next steps
    printNextSteps(projectDir);
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

async function collectConfig(
  options: CreateOptions,
): Promise<TemplateOptions & TenantConfig> {
  const questions: PromptObject<string>[] = [];

  if (!options.name) {
    questions.push({
      type: 'text',
      name: 'name',
      message: 'Institution name:',
      validate: (value: string) => value.length > 0 || 'Name is required',
    });
  }

  if (!options.slug) {
    questions.push({
      type: 'text',
      name: 'slug',
      message: 'Tenant slug (URL-safe, e.g., "legacy-career-institute"):',
      validate: (value: string) =>
        /^[a-z0-9-]+$/.test(value) ||
        'Slug must be lowercase alphanumeric with hyphens',
    });
  }

  if (!options.currency) {
    questions.push({
      type: 'select',
      name: 'currency',
      message: 'Default currency:',
      choices: [
        { title: 'GHS (Ghana Cedi)', value: 'GHS' },
        { title: 'USD (US Dollar)', value: 'USD' },
        { title: 'EUR (Euro)', value: 'EUR' },
        { title: 'NGN (Nigerian Naira)', value: 'NGN' },
        { title: 'KES (Kenyan Shilling)', value: 'KES' },
        { title: 'ZAR (South African Rand)', value: 'ZAR' },
      ],
      initial: 0,
    });
  }

  // Add questions for missing required fields
  questions.push(
    {
      type: 'text',
      name: 'timezone',
      message: 'Timezone (IANA format):',
      initial: 'Africa/Accra',
      validate: (value: string) => value.length > 0 || 'Timezone is required',
    },
    {
      type: 'text',
      name: 'contactEmail',
      message: 'Primary contact email:',
      validate: (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Valid email required',
    },
    {
      type: 'text',
      name: 'contactPhone',
      message: 'Primary contact phone (optional):',
    },
  );

  const answers = await prompts(questions);

  return {
    name: options.name ?? answers.name,
    slug:
      options.slug ??
      answers.slug ??
      slugify(options.name ?? answers.name ?? 'institute'),
    currency: options.currency ?? answers.currency ?? 'GHS',
    timezone: answers.timezone,
    contactEmail: answers.contactEmail,
    contactPhone: answers.contactPhone,
    deployment: options.cloud ? 'cloud' : 'on-prem',
    createdAt: new Date().toISOString(),
    branding: {
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      logoUrl: '',
    },
    modules: {
      admissions: true,
      studentPortal: true,
      staffPortal: true,
      basicAssessment: true,
      billingAccounting: true,
      stakeholderPortal: true,
      systemAdmin: true,
      fullExamination: false,
      inventoryProcurement: false,
      communications: false,
      hrManagement: false,
      campusServices: true,
      virtualClassroom: false,
    },
  };
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function printNextSteps(projectDir: string): void {
  console.log(
    '\n' + chalk.green('✓') + ' Institute project created successfully!\n',
  );
  console.log(chalk.bold('Next steps:'));
  console.log(`  cd ${path.relative(process.cwd(), projectDir) || projectDir}`);
  console.log('  # Review and edit tenant.config.yaml');
  console.log('  # Configure your .env file with database, Paystack, etc.');
  console.log('  # Run: docker compose up -d');
  console.log('\n' + chalk.bold('For cloud deployment:'));
  console.log('  npx create-institute-app deploy cloud');
  console.log('\n' + chalk.bold('For on-premise deployment:'));
  console.log('  npx create-institute-app deploy on-prem');
  console.log(
    '\n' +
      chalk.dim('Documentation: https://docs.abdac-consult.com/deployment'),
  );
}
