import { describe, it, expect } from 'vitest';
import { deepClone } from '../src/utils/clone.js';

describe('deepClone', () => {
  it('uses native structuredClone when available', () => {
    const original = globalThis.structuredClone;
    if (!original) {
      globalThis.structuredClone = function clone(obj) {
        if (obj && typeof obj === 'object') {
          const result = Array.isArray(obj) ? [] : {};
          for (const [k, v] of Object.entries(obj)) {
            result[k] = clone(v);
          }
          return result;
        }
        return obj;
      };
    }
    const obj = { a: undefined, nested: { b: 1 } };
    const cloned = deepClone(obj);
    expect('a' in cloned).toBe(true);
    expect(cloned.nested).not.toBe(obj.nested);
    if (original) {
      globalThis.structuredClone = original;
    } else {
      delete globalThis.structuredClone;
    }
  });

  it('falls back to JSON cloning when structuredClone is unavailable', () => {
    const original = globalThis.structuredClone;
    globalThis.structuredClone = undefined;
    const obj = { a: undefined, nested: { b: 1 } };
    const cloned = deepClone(obj);
    expect('a' in cloned).toBe(false);
    expect(cloned.nested).not.toBe(obj.nested);
    if (original) {
      globalThis.structuredClone = original;
    } else {
      delete globalThis.structuredClone;
    }
  });
});
