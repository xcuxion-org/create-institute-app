export interface TemplateOptions {
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
}
export declare function copyTemplate(templateRoot: string, targetDir: string, options: TemplateOptions): Promise<void>;
export declare function createDefaultTemplate(templateRoot: string): Promise<void>;
//# sourceMappingURL=template.d.ts.map