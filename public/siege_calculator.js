document.addEventListener('DOMContentLoaded', () => {
    let materialsDB = {};
    let materialsMap = new Map();
    let siegeVolumesData = {};

    const siegeWeaponTypeSelect = document.getElementById('siege-weapon-type');
    const siegeWeaponComponentsDiv = document.getElementById('siege-weapon-components');
    const siegeResultsDiv = document.getElementById('siege-crafting-results');

    async function loadData() {
        try {
            const [
                db,
                woods,
                stones,
                elementals,
                alloys,
                siegeVolumesList
            ] = await Promise.all([
                fetch('materials.json', { cache: 'no-cache' }).then(r => r.json()),
                fetch('wood_types.json', { cache: 'no-cache' }).then(r => r.json()),
                fetch('stone_types.json', { cache: 'no-cache' }).then(r => r.json()),
                fetch('Master_Elemental_Metals.json', { cache: 'no-cache' }).then(r => r.json()),
                fetch('Master_Metal_Alloys.json', { cache: 'no-cache' }).then(r => r.json()),
                fetch('siege_volumes.json', { cache: 'no-cache' }).then(r => r.json())
            ]);

            buildMaterialsDB(db, woods, stones, elementals, alloys);

            siegeVolumesList.forEach(item => {
                if (!siegeVolumesData[item.siege_weapon_type]) {
                    siegeVolumesData[item.siege_weapon_type] = {};
                }
                siegeVolumesData[item.siege_weapon_type][item.component_name] = parseFloat(item.volume_cm3);
            });

            populateDropdowns();
            setupEventListeners();
            calculateResults();
        } catch (err) {
            console.error('Failed to load siege crafting data:', err);
            if (siegeResultsDiv) {
                siegeResultsDiv.innerHTML = '<p class="text-red-400">Error loading crafting data. Please try again later.</p>';
            }
        }
    }

    function buildMaterialsDB(db, woods, stones, elementals, alloys) {
        const slug = name => name.toLowerCase().replace(/\s+/g, '_');
        const defDensity = cat => ({ Wood: 0.6, Minerals: 2.5 }[cat] || 1);

        db['Wood'] = Object.fromEntries(
            Object.entries(woods).map(([type, list]) => [
                type,
                list.map(name => ({ id: slug(name), name, density: 0.6 }))
            ])
        );

        const collectMinerals = obj => {
            const names = [];
            (function trav(node) {
                if (Array.isArray(node)) {
                    names.push(...node);
                } else if (node && typeof node === 'object') {
                    Object.values(node).forEach(trav);
                }
            })(obj);
            return [...new Set(names)];
        };
        db['Minerals'] = {
            A: collectMinerals(stones).map(name => ({ id: slug(name), name, density: 2.5 }))
        };

        const procMetal = m => ({
            id: slug(m.name),
            name: m.name,
            density: parseFloat(m.density || m.mechanical_properties?.density?.value || 7.8)
        });
        db['Metals'] = db['Metals'] || {};
        db['Metals']['Elemental Metals'] = (elementals.elements || []).map(procMetal);
        db['Metals']['Metal Alloys'] = (alloys.elements || []).map(procMetal);

        db['Dev'] = {
            Dev: [
                {
                    id: 'dev_material',
                    name: 'Dev Material',
                    density: 1,
                    slash: 1,
                    pierce: 1,
                    blunt: 1,
                    defense_slash: 1,
                    defense_pierce: 1,
                    defense_blunt: 1,
                    fire: 1,
                    water: 1,
                    wind: 1,
                    earth: 1,
                },
            ],
        };

        // Normalize categories that are stored as arrays so they behave like
        // an object with a default "A" subcategory. This mirrors the
        // structure used throughout the crafting calculators and prevents
        // runtime errors when iterating below.
        for (const [cat, subcats] of Object.entries(db)) {
            if (Array.isArray(subcats)) {
                db[cat] = { A: subcats };
            }
        }

        // Flatten all materials into the map while capturing category and
        // subcategory metadata. Guard against unexpected non-array entries.
        for (const [cat, subcats] of Object.entries(db)) {
            for (const [sub, arr] of Object.entries(subcats)) {
                if (!Array.isArray(arr)) continue;
                arr.forEach(m => {
                    if (!m.id) m.id = slug(m.name);
                    if (m.density == null) m.density = defDensity(cat);
                    materialsMap.set(m.id, { ...m, category: cat, subCategory: sub });
                });
            }
        }

        materialsDB = db;
    }

    function populateDropdowns() {
        Object.keys(siegeVolumesData).forEach(type => addOption(siegeWeaponTypeSelect, type, type));
    }

    function setupEventListeners() {
        siegeWeaponTypeSelect.addEventListener('change', () => {
            populateSiegeWeaponComponents();
            calculateAndDisplaySiegeResults();
        });
    }

    function calculateResults() {
        populateSiegeWeaponComponents();
        calculateAndDisplaySiegeResults();
    }

    function subcategoriesFor(category) {
        return Object.keys(materialsDB[category] || {}).filter(s => s !== 'A');
    }

    function itemsForCategory(category, subCategory) {
        const cat = materialsDB[category] || {};
        if (cat[subCategory]) return cat[subCategory];
        if (cat['A']) return cat['A'];
        return [];
    }

    function allowedCategories(type, comp) {
        if (type === 'Ammunition') return ['Metals', 'Minerals', 'Wood', 'Dev'];
        if (comp === 'frame' || comp === 'head') return ['Wood', 'Metals', 'Dev'];
        return Object.keys(materialsDB).sort();
    }

    function populateSiegeWeaponComponents() {
        const type = siegeWeaponTypeSelect.value;
        siegeWeaponComponentsDiv.innerHTML = '';
        if (!type || !siegeVolumesData[type]) return;

        Object.keys(siegeVolumesData[type]).forEach(comp => {
            const idBase = `siege-comp-${comp.toLowerCase().replace(/ /g, '-')}`;
            const label = createLabel(comp, idBase + '-category');
            const container = document.createElement('div');
            container.dataset.comp = comp;

            const cats = allowedCategories(type, comp.toLowerCase());
            const { categorySelect, subSelect, materialSelect } = buildMaterialSelector(idBase, cats);

            categorySelect.addEventListener('change', () => {
                updateSubSelect(categorySelect, subSelect);
                updateMaterialSelect(categorySelect, subSelect, materialSelect);
                calculateAndDisplaySiegeResults();
            });
            subSelect.addEventListener('change', () => {
                updateMaterialSelect(categorySelect, subSelect, materialSelect);
                calculateAndDisplaySiegeResults();
            });
            materialSelect.addEventListener('change', calculateAndDisplaySiegeResults);

            updateSubSelect(categorySelect, subSelect);
            updateMaterialSelect(categorySelect, subSelect, materialSelect);

            container.appendChild(label);
            container.appendChild(categorySelect);
            if (subSelect.style.display !== 'none') container.appendChild(subSelect);
            container.appendChild(materialSelect);
            siegeWeaponComponentsDiv.appendChild(container);
        });
    }

    function buildMaterialSelector(idBase, cats) {
        const categorySelect = createSelect(idBase + '-category');
        cats.forEach(c => addOption(categorySelect, c, c));

        const subSelect = createSelect(idBase + '-subcategory');
        const materialSelect = createSelect(idBase + '-material');

        return { categorySelect, subSelect, materialSelect };
    }

    function updateSubSelect(categorySelect, subSelect) {
        const subs = subcategoriesFor(categorySelect.value);
        subSelect.innerHTML = '';
        if (subs.length) {
            subs.forEach(s => addOption(subSelect, s, s));
            subSelect.style.display = '';
        } else {
            addOption(subSelect, 'A', 'A');
            subSelect.style.display = 'none';
        }
    }

    function updateMaterialSelect(categorySelect, subSelect, materialSelect) {
        const sub = subSelect.style.display === 'none' ? 'A' : subSelect.value;
        const items = itemsForCategory(categorySelect.value, sub);
        materialSelect.innerHTML = '';
        items.forEach(m => addOption(materialSelect, m.name, m.id));
    }

    function calculateAndDisplaySiegeResults() {
        const type = siegeWeaponTypeSelect.value;
        if (!type || !siegeVolumesData[type]) return;

        const components = getComponentData();
        if (!components) return;

        const result = calculatePhysicalItemStats(components);
        siegeResultsDiv.innerHTML = formatResults(result);
    }

    function getComponentData() {
        const components = {};
        const compContainers = siegeWeaponComponentsDiv.querySelectorAll('[data-comp]');
        for (const container of compContainers) {
            const compName = container.dataset.comp;
            const category = container.querySelector('select[id$="-category"]').value;
            const subSel = container.querySelector('select[id$="-subcategory"]');
            const subCategory = subSel.style.display === 'none' ? 'A' : subSel.value;
            const materialId = container.querySelector('select[id$="-material"]').value;
            const material = materialsMap.get(materialId);
            if (!material) return null;
            const type = siegeWeaponTypeSelect.value;
            const volume = siegeVolumesData[type][compName];
            components[compName] = { material, volume };
        }
        return components;
    }

    function calculatePhysicalItemStats(components) {
        let totalMass = 0;
        const requiredMaterials = {};
        for (const name in components) {
            const comp = components[name];
            const density = parseFloat(comp.material.density);
            totalMass += comp.volume * density;
            requiredMaterials[name] = {
                name: comp.material.name,
                units: (comp.volume * density) / 100
            };
        }
        return { requiredMaterials, totalMass: totalMass / 1000 };
    }

    // Helpers
    function addOption(select, text, value) {
        const opt = document.createElement('option');
        opt.textContent = text;
        opt.value = value;
        select.appendChild(opt);
    }

    function createSelect(id) {
        const select = document.createElement('select');
        select.id = id;
        select.name = id;
        select.className = 'mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white';
        return select;
    }

    function createLabel(text, forId) {
        const label = document.createElement('label');
        label.htmlFor = forId;
        label.className = 'block text-sm font-medium text-slate-300';
        label.textContent = text.charAt(0).toUpperCase() + text.slice(1);
        return label;
    }

    function formatResults({ requiredMaterials, totalMass }) {
        let materialsList = '';
        for (const name in requiredMaterials) {
            materialsList += `<li>${name}: ${requiredMaterials[name].units.toFixed(2)} units of ${requiredMaterials[name].name}</li>`;
        }
        return `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Required Materials:</h5>
            <ul class="list-disc list-inside">${materialsList}</ul>
            <h5 class="text-md font-semibold text-emerald-400 mt-2">Item Stats:</h5>
            <p>Estimated Mass: ${totalMass.toFixed(2)} kg</p>
        `;
    }

    loadData();
});

