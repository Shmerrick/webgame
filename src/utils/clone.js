export function deepClone(obj) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

export default deepClone;
