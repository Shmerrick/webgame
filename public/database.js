// Base URL ensures fetch paths resolve correctly in both browser and Node environments
// When bundled, import.meta.url may point inside the dist folder which breaks
// relative fetch paths. Prefer the page location in the browser so resources
// are always resolved relative to the served HTML, falling back to import.meta.url
// for non-browser environments.
const baseUrl = new URL(
    '.',
    typeof window !== 'undefined' ? window.location.href : import.meta.url
);

const dbIndexPromise = (async () => {
    try {
        const res = await fetch(new URL('database.json', baseUrl), { cache: 'no-cache' });
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

export async function getDatabaseSection(key) {
    const index = await dbIndexPromise;
    if (!dbCache[key]) {
        const entry = index[key];
        if (!entry) throw new Error(`Database key not found: ${key}`);
        if (typeof entry === 'string') {
            dbCache[key] = (async () => {
                try {
                    const res = await fetch(new URL(entry, baseUrl), { cache: 'no-cache' });
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
            dbCache[key] = getDatabaseSection(entry.source).then(data => {
                const sectionData = data[entry.section];
                if (sectionData === undefined) {
                    throw new Error(`Section ${entry.section} not found in ${entry.source}`);
                }
                return sectionData;
            });
        } else {
            throw new Error(`Invalid database entry for ${key}`);
        }
    }
    return dbCache[key];
}

if (typeof window !== 'undefined') {
    window.getDatabaseSection = getDatabaseSection;
}
