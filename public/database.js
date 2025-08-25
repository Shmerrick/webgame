const dbIndexPromise = fetch('database.json', { cache: 'no-cache' }).then(res => res.json());
const dbCache = {};

async function getDatabaseSection(key) {
    const index = await dbIndexPromise;
    if (!dbCache[key]) {
        const entry = index[key];
        if (!entry) throw new Error(`Database key not found: ${key}`);
        if (typeof entry === 'string') {
            dbCache[key] = fetch(entry, { cache: 'no-cache' }).then(res => {
                if (entry.endsWith('.txt')) {
                    return res.text();
                }
                return res.json();
            });
        } else if (entry.source && entry.section) {
            dbCache[key] = getDatabaseSection(entry.source).then(data => data[entry.section]);
        } else {
            throw new Error(`Invalid database entry for ${key}`);
        }
    }
    return dbCache[key];
}
