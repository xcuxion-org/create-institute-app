import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import {
  TenantConfig,
  validateTenantConfig,
  getDefaultConfig,
} from './config-generator.js';

export async function loadTenantConfig(
  configPath: string,
): Promise<TenantConfig> {
  const content = await fs.readFile(configPath, 'utf8');
  return yaml.parse(content) as TenantConfig;
}

export { validateTenantConfig, getDefaultConfig };
export type { TenantConfig };

export async function findTenantConfig(
  startDir: string = process.cwd(),
): Promise<string | null> {
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

export async function loadOrCreateConfig(
  projectDir: string,
): Promise<TenantConfig> {
  const configPath = path.join(projectDir, 'tenant.config.yaml');

  if (await fs.pathExists(configPath)) {
    return loadTenantConfig(configPath);
  }

  // Return default config if none exists
  return getDefaultConfig();
}

export function mergeConfigs(
  base: TenantConfig,
  override: Partial<TenantConfig>,
): TenantConfig {
  return {
    ...base,
    ...override,
    branding: { ...base.branding, ...override.branding },
    modules: { ...base.modules, ...override.modules },
  };
}
