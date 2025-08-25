import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import vm from 'vm';

describe('getDatabaseSection', () => {
  it('throws on failed fetch', async () => {
    const code = fs.readFileSync('public/database.js', 'utf-8');
    const responses = {
      'database.json': { ok: true, json: async () => ({ foo: 'foo.json' }) },
      'foo.json': { ok: false, status: 404, statusText: 'Not Found' },
    };
    const fetch = vi.fn(async (url) => {
      const res = responses[url];
      if (!res) throw new Error('unknown url');
      return res;
    });
    const sandbox = { fetch, console, setTimeout, clearTimeout };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    await expect(sandbox.getDatabaseSection('foo')).rejects.toThrow('Failed to fetch foo.json');
  });
});
