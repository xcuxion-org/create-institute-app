export interface CreateOptions {
    name?: string;
    slug?: string;
    currency?: string;
    cloud?: boolean;
    skipInstall?: boolean;
    skipGit?: boolean;
}
export declare function createInstituteApp(targetDir: string | undefined, options: CreateOptions): Promise<void>;
//# sourceMappingURL=create.d.ts.map