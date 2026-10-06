import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
export async function generateTenantConfig(projectDir, config) {
    const configPath = path.join(projectDir, 'tenant.config.yaml');
    const yamlContent = yaml.stringify(config, { lineWidth: 120 });
    await fs.writeFile(configPath, yamlContent, 'utf8');
}
export async function loadTenantConfig(configPath) {
    const content = await fs.readFile(configPath, 'utf8');
    return yaml.parse(content);
}
export function validateTenantConfig(config) {
    const errors = [];
    const warnings = [];
    // Required fields
    if (!config.name || config.name.trim().length === 0) {
        errors.push('Institution name is required');
    }
    if (!config.slug || config.slug.trim().length === 0) {
        errors.push('Tenant slug is required');
    }
    else if (!/^[a-z0-9-]+$/.test(config.slug)) {
        errors.push('Tenant slug must be lowercase alphanumeric with hyphens only');
    }
    if (!config.currency || config.currency.trim().length === 0) {
        errors.push('Currency is required');
    }
    if (!config.timezone || config.timezone.trim().length === 0) {
        errors.push('Timezone is required');
    }
    if (!config.contactEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail)) {
        errors.push('Valid contact email is required');
    }
    if (!['on-prem', 'cloud'].includes(config.deployment)) {
        errors.push('Deployment must be "on-prem" or "cloud"');
    }
    // Validate modules
    const requiredModules = [
        'admissions',
        'studentPortal',
        'staffPortal',
        'basicAssessment',
        'billingAccounting',
        'stakeholderPortal',
        'systemAdmin',
        'campusServices',
    ];
    for (const module of requiredModules) {
        if (config.modules[module] !== true) {
            warnings.push(`Core module "${module}" is not active (should be true for Core modules)`);
        }
    }
    // Validate branding
    if (config.branding) {
        if (!config.branding.primaryColor ||
            !/^#[0-9a-fA-F]{6}$/.test(config.branding.primaryColor)) {
            warnings.push('Primary color should be a valid hex color (e.g., #1e40af)');
        }
        if (!config.branding.secondaryColor ||
            !/^#[0-9a-fA-F]{6}$/.test(config.branding.secondaryColor)) {
            warnings.push('Secondary color should be a valid hex color (e.g., #3b82f6)');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
export function getDefaultConfig(overrides = {}) {
    return {
        name: overrides.name || 'New Institute',
        slug: overrides.slug || 'new-institute',
        currency: overrides.currency || 'GHS',
        timezone: overrides.timezone || 'Africa/Accra',
        contactEmail: overrides.contactEmail || 'admin@example.com',
        contactPhone: overrides.contactPhone,
        deployment: overrides.deployment || 'on-prem',
        branding: {
            primaryColor: '#1e40af',
            secondaryColor: '#3b82f6',
            logoUrl: '',
            ...overrides.branding,
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
            ...overrides.modules,
        },
        createdAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=config-generator.js.map