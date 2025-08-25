const dbIndexPromise = (async () => {
    try {
        const res = await fetch('database.json', { cache: 'no-cache' });
        if (!res.ok) {
            throw new Error(`Failed to load database index: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
})();
const dbCache = {};

async function getDatabaseSection(key) {
    const index = await dbIndexPromise;
    if (!dbCache[key]) {
        const entry = index[key];
        if (!entry) throw new Error(`Database key not found: ${key}`);
        if (typeof entry === 'string') {
            dbCache[key] = (async () => {
                try {
                    const res = await fetch(entry, { cache: 'no-cache' });
                    if (!res.ok) {
                        throw new Error(`Failed to fetch ${entry}: ${res.status} ${res.statusText}`);
                    }
                    if (entry.endsWith('.txt')) {
                        return await res.text();
                    }
                    return await res.json();
                } catch (err) {
                    throw new Error(`Error loading ${entry}: ${err.message}`);
                }
            })();
        } else if (entry.source && entry.section) {
            dbCache[key] = getDatabaseSection(entry.source).then(data => data[entry.section]);
        } else {
            throw new Error(`Invalid database entry for ${key}`);
        }
    }
    return dbCache[key];
}
