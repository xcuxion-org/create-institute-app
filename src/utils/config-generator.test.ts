import { describe, it, expect } from 'vitest';
import { getDefaultConfig, validateTenantConfig } from './config-generator.js';

describe('config-generator', () => {
  describe('getDefaultConfig', () => {
    it('returns a valid default configuration', () => {
      const config = getDefaultConfig();

      expect(config.name).toBe('New Institute');
      expect(config.slug).toBe('new-institute');
      expect(config.currency).toBe('GHS');
      expect(config.timezone).toBe('Africa/Accra');
      expect(config.deployment).toBe('on-prem');
      expect(config.modules.admissions).toBe(true);
      expect(config.modules.virtualClassroom).toBe(false);
      expect(config.branding.primaryColor).toBe('#1e40af');
    });

    it('allows overrides', () => {
      const config = getDefaultConfig({
        name: 'Test Institute',
        currency: 'USD',
        modules: { virtualClassroom: true },
      });

      expect(config.name).toBe('Test Institute');
      expect(config.currency).toBe('USD');
      expect(config.modules.virtualClassroom).toBe(true);
      // Other modules should still have defaults
      expect(config.modules.admissions).toBe(true);
    });
  });

  describe('validateTenantConfig', () => {
    it('validates a complete config', () => {
      const config = getDefaultConfig();
      const result = validateTenantConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing required fields', () => {
      // Create config directly without getDefaultConfig to avoid default fallbacks
      const config = {
        name: '',
        slug: '',
        currency: '',
        timezone: '',
        contactEmail: '',
        deployment: 'on-prem',
        branding: {
          primaryColor: '#1e40af',
          secondaryColor: '#3b82f6',
          logoUrl: '',
        },
        modules: { admissions: true },
        createdAt: new Date().toISOString(),
      };
      const result = validateTenantConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid slug format', () => {
      const config = getDefaultConfig({ slug: 'Invalid_Slug' });
      const result = validateTenantConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('slug'))).toBe(true);
    });

    it('rejects invalid email', () => {
      const config = getDefaultConfig({ contactEmail: 'invalid-email' });
      const result = validateTenantConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('email'))).toBe(true);
    });

    it('warns about inactive core modules', () => {
      const config = getDefaultConfig({ modules: { admissions: false } });
      const result = validateTenantConfig(config);

      expect(result.valid).toBe(true); // Still valid, just warnings
      expect(result.warnings.some((w) => w.includes('admissions'))).toBe(true);
    });
  });
});
