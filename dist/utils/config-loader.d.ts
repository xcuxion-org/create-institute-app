import { TenantConfig, validateTenantConfig, getDefaultConfig } from './config-generator.js';
export declare function loadTenantConfig(configPath: string): Promise<TenantConfig>;
export { validateTenantConfig, getDefaultConfig };
export type { TenantConfig };
export declare function findTenantConfig(startDir?: string): Promise<string | null>;
export declare function loadOrCreateConfig(projectDir: string): Promise<TenantConfig>;
export declare function mergeConfigs(base: TenantConfig, override: Partial<TenantConfig>): TenantConfig;
//# sourceMappingURL=config-loader.d.ts.map