import { describe, it, expect, vi } from 'vitest';

describe('getDatabaseSection', () => {
  it('throws on failed fetch', async () => {
    vi.resetModules();
    const responses = {
      'database.json': { ok: true, json: async () => ({ foo: 'foo.json' }) },
      'foo.json': { ok: false, status: 404, statusText: 'Not Found' },
    };
    const fetch = vi.fn(async (url) => {
      const key = url instanceof URL ? url.pathname.split('/').pop() : url;
      const res = responses[key];
      if (!res) throw new Error('unknown url');
      return res;
    });
    vi.stubGlobal('fetch', fetch);
    const { getDatabaseSection } = await import('../public/database.js');
    await expect(getDatabaseSection('foo')).rejects.toThrow('Failed to fetch foo.json');
    vi.unstubAllGlobals();
  });

  it('throws if section missing', async () => {
    vi.resetModules();
    const responses = {
      'database.json': {
        ok: true,
        json: async () => ({ base: 'base.json', missing: { source: 'base', section: 'nope' } }),
      },
      'base.json': { ok: true, json: async () => ({ yes: 1 }) },
    };
    const fetch = vi.fn(async (url) => {
      const key = url instanceof URL ? url.pathname.split('/').pop() : url;
      const res = responses[key];
      if (!res) throw new Error('unknown url');
      return res;
    });
    vi.stubGlobal('fetch', fetch);
    const { getDatabaseSection } = await import('../public/database.js');
    await expect(getDatabaseSection('missing')).rejects.toThrow('Section nope not found in base');
    vi.unstubAllGlobals();
  });
});
