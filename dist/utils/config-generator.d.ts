export interface TenantConfig {
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    contactEmail: string;
    contactPhone?: string;
    deployment: 'on-prem' | 'cloud';
    branding: {
        primaryColor: string;
        secondaryColor: string;
        logoUrl: string;
    };
    modules: Record<string, boolean>;
    createdAt: string;
}
export declare function generateTenantConfig(projectDir: string, config: TenantConfig): Promise<void>;
export declare function loadTenantConfig(configPath: string): Promise<TenantConfig>;
export declare function validateTenantConfig(config: TenantConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
export declare function getDefaultConfig(overrides?: Partial<TenantConfig>): TenantConfig;
//# sourceMappingURL=config-generator.d.ts.map