import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import { validateTenantConfig, getDefaultConfig } from './config-generator.js';
const __filename = fileURLToPath(import.meta.url);
export async function loadTenantConfig(configPath) {
    const content = await fs.readFile(configPath, 'utf8');
    return yaml.parse(content);
}
export { validateTenantConfig, getDefaultConfig };
export async function findTenantConfig(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
        const configPath = path.join(currentDir, 'tenant.config.yaml');
        if (await fs.pathExists(configPath)) {
            return configPath;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
export async function loadOrCreateConfig(projectDir) {
    const configPath = path.join(projectDir, 'tenant.config.yaml');
    if (await fs.pathExists(configPath)) {
        return loadTenantConfig(configPath);
    }
    // Return default config if none exists
    return getDefaultConfig();
}
export function mergeConfigs(base, override) {
    return {
        ...base,
        ...override,
        branding: { ...base.branding, ...override.branding },
        modules: { ...base.modules, ...override.modules },
    };
}
//# sourceMappingURL=config-loader.js.map