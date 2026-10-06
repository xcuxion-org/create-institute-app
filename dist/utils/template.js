import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
export async function copyTemplate(templateRoot, targetDir, options) {
    await fs.ensureDir(targetDir);
    await copyDirWithTemplate(templateRoot, targetDir, options);
}
async function copyDirWithTemplate(src, dest, options) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await fs.ensureDir(destPath);
            await copyDirWithTemplate(srcPath, destPath, options);
        }
        else {
            const isTemplate = entry.name.endsWith('.template');
            const destFileName = isTemplate ? entry.name.replace('.template', '') : entry.name;
            const finalDestPath = path.join(dest, destFileName);
            const content = await fs.readFile(srcPath, 'utf8');
            const processed = processTemplate(content, options);
            await fs.writeFile(finalDestPath, processed, 'utf8');
        }
    }
}
function processTemplate(content, options) {
    return content
        .replace(/\{\{NAME\}\}/g, options.name)
        .replace(/\{\{SLUG\}\}/g, options.slug)
        .replace(/\{\{CURRENCY\}\}/g, options.currency)
        .replace(/\{\{TIMEZONE\}\}/g, options.timezone)
        .replace(/\{\{CONTACT_EMAIL\}\}/g, options.contactEmail)
        .replace(/\{\{CONTACT_PHONE\}\}/g, options.contactPhone || '')
        .replace(/\{\{DEPLOYMENT\}\}/g, options.deployment)
        .replace(/\{\{PRIMARY_COLOR\}\}/g, options.branding.primaryColor)
        .replace(/\{\{SECONDARY_COLOR\}\}/g, options.branding.secondaryColor)
        .replace(/\{\{LOGO_URL\}\}/g, options.branding.logoUrl)
        .replace(/\{\{MODULES\}\}/g, JSON.stringify(options.modules, null, 2))
        .replace(/\{\{CREATED_AT\}\}/g, new Date().toISOString());
}
export async function createDefaultTemplate(templateRoot) {
    // This function is kept for backwards compatibility but templates are now
    // pre-created in the templates/ directory. We just ensure the directory exists.
    await fs.ensureDir(templateRoot);
}
//# sourceMappingURL=template.js.map