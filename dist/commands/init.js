import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import { generateTenantConfig } from '../utils/config-generator.js';
const __filename = fileURLToPath(import.meta.url);
export async function initConfig(options) {
    const projectDir = process.cwd();
    const configPath = path.join(projectDir, 'tenant.config.yaml');
    if (await fs.pathExists(configPath) && !options.force) {
        console.log(chalk.yellow('tenant.config.yaml already exists. Use --force to overwrite.'));
        process.exit(1);
    }
    console.log(chalk.bold('Initializing tenant configuration...\n'));
    const questions = [
        {
            type: 'text',
            name: 'name',
            message: 'Institution name:',
            validate: (value) => value.length > 0 || 'Name is required',
        },
        {
            type: 'text',
            name: 'slug',
            message: 'Tenant slug (URL-safe):',
            validate: (value) => /^[a-z0-9-]+$/.test(value) || 'Slug must be lowercase alphanumeric with hyphens',
        },
        {
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
        },
        {
            type: 'select',
            name: 'deployment',
            message: 'Deployment type:',
            choices: [
                { title: 'On-Premise (self-hosted)', value: 'on-prem' },
                { title: 'Cloud (Abdac-hosted)', value: 'cloud' },
            ],
            initial: 0,
        },
        {
            type: 'text',
            name: 'timezone',
            message: 'Timezone (IANA format):',
            initial: 'Africa/Accra',
            validate: (value) => value.length > 0 || 'Timezone is required',
        },
        {
            type: 'text',
            name: 'contactEmail',
            message: 'Primary contact email:',
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Valid email required',
        },
        {
            type: 'text',
            name: 'contactPhone',
            message: 'Primary contact phone (optional):',
        },
    ];
    const answers = await prompts(questions);
    const config = {
        name: answers.name,
        slug: answers.slug,
        currency: answers.currency,
        deployment: answers.deployment,
        timezone: answers.timezone,
        contactEmail: answers.contactEmail,
        contactPhone: answers.contactPhone,
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
    await generateTenantConfig(projectDir, config);
    console.log(chalk.green('\n✓ Tenant configuration created at tenant.config.yaml'));
    console.log(chalk.dim('Edit this file to customize modules, branding, and other settings.'));
}
//# sourceMappingURL=init.js.map