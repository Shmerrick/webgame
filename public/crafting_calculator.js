console.log("CRAFTING_CALCULATOR: Script loaded.");
document.addEventListener('DOMContentLoaded', () => {
    // Common
    let materialsData = new Map();
    let bannedNames = [];

    const ARMOR_CLASS = {
        Light:  { physical: 0.45, magical: 0.45 },
        Medium: { physical: 0.65, magical: 0.65 },
        Heavy:  { physical: 0.85, magical: 0.85 },
    };
    const MATERIALS_FOR_CLASS = {
        None:   [],
        Light:  ["Leather","Scales","Cloth","Fur","Dev"],
        Medium: ["Leather","Scales","Carapace","Wood","Bone","Dev"],
        Heavy:  ["Metals","Dev"],
    };
    const MATERIALS_FOR_INNER = ["Linen", "Cloth", "Leather", "Fur", "Dev"];
    const MATERIALS_FOR_BINDING = ["Leather", "Dev"];
    const MATERIALS_FOR_JEWELRY_SETTING = ["Metals", "Dev"];
    const MATERIALS_FOR_JEWELRY_GEM = ["Rock Types", "Dev"];

    // Armor
    const armorPieceSelect = document.getElementById('armor-piece');
    const armorClassSelect = document.getElementById('armor-class');
    const armorNameInput = document.getElementById('armor-name');
    const outerCategorySelect = document.getElementById('outer-category');
    const outerMaterialSelect = document.getElementById('outer-material');
    const innerCategorySelect = document.getElementById('inner-category');
    const innerMaterialSelect = document.getElementById('inner-material');
    const bindingCategorySelect = document.getElementById('binding-category');
    const bindingMaterialSelect = document.getElementById('binding-material');
    const armorResultsDiv = document.getElementById('crafting-results');
    let armorVolumesData = {};

    // Shield
    const shieldTypeSelect = document.getElementById('shield-type');
    const shieldBodyCategorySelect = document.getElementById('shield-body-category');
    const shieldBodyMaterialSelect = document.getElementById('shield-body-material');
    const shieldBossCategorySelect = document.getElementById('shield-boss-category');
    const shieldBossMaterialSelect = document.getElementById('shield-boss-material');
    const shieldRimCategorySelect = document.getElementById('shield-rim-category');
    const shieldRimMaterialSelect = document.getElementById('shield-rim-material');
    const shieldResultsDiv = document.getElementById('shield-crafting-results');
    let shieldVolumesData = {};

    // Weapon
    const weaponTypeSelect = document.getElementById('weapon-type');
    const weaponNameInput = document.getElementById('weapon-name');
    const weaponHandedRadios = document.querySelectorAll('input[name="weapon-handed"]');
    const weaponComponentsDiv = document.getElementById('weapon-components');
    const weaponResultsDiv = document.getElementById('weapon-crafting-results');
    let weaponVolumesData = {};

    // Bowyer
    const bowTypeSelect = document.getElementById('bow-type');
    const bowComponentsDiv = document.getElementById('bow-components');
    const bowResultsDiv = document.getElementById('bow-crafting-results');
    // Bowyer uses weapon a subset of weapon volumes

    // Alchemy
    const ingredient1Select = document.getElementById('ingredient1');
    const ingredient2Select = document.getElementById('ingredient2');
    const alchemyResultsDiv = document.getElementById('alchemy-results');
    let potionIngredientsData = [];
    let alchemyRecipesData = [];

    // Enchanting
    const rune1Select = document.getElementById('rune1');
    const rune2Select = document.getElementById('rune2');
    const enchantingResultsDiv = document.getElementById('enchanting-results');
    let enchantmentRunesData = [];

    // Gemstone Refining
    const roughGemstoneSelect = document.getElementById('rough-gemstone');
    const refiningResultsDiv = document.getElementById('refining-results');

    // Jewelry Crafting
    const jewelryTypeSelect = document.getElementById('jewelry-type');
    const jewelryMetalSelect = document.getElementById('jewelry-metal');
    const jewelryResultsDiv = document.getElementById('jewelry-crafting-results');

    const WEAPONS = {
        Sword:   { type: "melee",   massKilograms: 3, baseCost: 30, head: { Blunt: 0.10, Slash: 0.35, Pierce: 0.20 }, direction: { Left: "Slash", Right: "Slash", Up: "Slash", Down: "Pierce" } },
        Axe:     { type: "melee",   massKilograms: 4, baseCost: 40, head: { Blunt: 0.20, Slash: 0.45, Pierce: 0.10 }, direction: { Left: "Slash", Right: "Slash", Up: "Slash", Down: "Blunt" } },
        Hammer:  { type: "melee",   massKilograms: 6, baseCost: 40, head: { Blunt: 0.60, Slash: 0.10, Pierce: 0.10 }, direction: { Left: "Blunt", Right: "Blunt", Up: "Blunt", Down: "Blunt" } },
        Spear:   { type: "melee",   massKilograms: 3, baseCost: 30, head: { Blunt: 0.10, Slash: 0.15, Pierce: 0.45 }, direction: { Left: "Slash", Right: "Slash", Up: "Pierce", Down: "Pierce" } },
        Dagger:  { type: "melee",   massKilograms: 1, baseCost: 20, head: { Blunt: 0.05, Slash: 0.20, Pierce: 0.30 }, direction: { Left: "Slash", Right: "Slash", Up: "Slash", Down: "Pierce" } },
        Bow:     { type: "ranged",  drawWeight: 50, head: { Pierce: 0.40 } },
        Crossbow:{ type: "ranged",  drawWeight: 35, head: { Pierce: 0.30 } },
        Sling:   { type: "ranged",  drawWeight: 15, head: { Blunt: 0.20 } },
        Throwing:{ type: "ranged",  drawWeight: 20, head: { Pierce: 0.25 } },
        Lance:   { type: "mounted", massKilograms: 5, head: { Blunt: 0.20, Pierce: 0.50 }, speed: { Walk: 0.5, Trot: 0.9, Canter: 1.2, Gallop: 1.6 } },
        Polesword: { type: "melee", massKilograms: 5, baseCost: 35, head: { Blunt: 0.10, Slash: 0.35, Pierce: 0.25 }, direction: { Left: "Slash", Right: "Slash", Up: "Pierce", Down: "Slash" } },
        Poleaxe: { type: "melee", massKilograms: 6, baseCost: 40, head: { Blunt: 0.25, Slash: 0.30, Pierce: 0.15 }, direction: { Left: "Slash", Right: "Blunt", Up: "Pierce", Down: "Slash" } },
    };

    const MATERIALS_FOR_HANDLE_CORE = ["Wood", "Metals", "Dev"];
    const MATERIALS_FOR_HANDLE_GRIP = ["Cloth", "Leather", "Dev"];
    const MATERIALS_FOR_HANDLE_FITTING = ["Metals", "Rock Types", "Dev"];
    const MATERIALS_FOR_HEAD = ["Metals", "Rock Types", "Wood", "Dev"];
    const BANNED_WEAPON_HEAD_MATERIALS = ["Carapace", "Cloth", "Fur", "Herbs", "Leather", "Linen", "Scales"];

    // Fetch and process data
    async function loadData() {
        console.log("CRAFTING_CALCULATOR: loadData function started.");
        try {
            console.log("CRAFTING_CALCULATOR: Starting data load...");
            const [
                baseMaterials,
                woodList,
                elementalList,
                alloyList,
                rockTypes,
                armorVolumesList,
                shieldVolumesList,
                weaponVolumesList,
                potionIngredientsList,
                enchantmentRunesList,
                bannedNamesText,
                alchemyRecipesList
            ] = await Promise.all([
                getDatabaseSection('materials'),
                getDatabaseSection('woodTypes'),
                getDatabaseSection('elementalMetals'),
                getDatabaseSection('metalAlloys'),
                getDatabaseSection('rockTypes'),
                getDatabaseSection('armorVolumes'),
                getDatabaseSection('shieldVolumes'),
                getDatabaseSection('weaponVolumes'),
                getDatabaseSection('potionIngredients'),
                getDatabaseSection('enchantmentRunes'),
                getDatabaseSection('bannedNames'),
                getDatabaseSection('alchemyRecipes')
            ]);
            console.log("CRAFTING_CALCULATOR: All files fetched.");

            const db = buildMaterialDB(baseMaterials, woodList, elementalList, alloyList, rockTypes);
            db.Dev = [
                {
                    id: 'dev_material',
                    name: 'Dev Material',
                    Name: 'Dev Material',
                    Density: 1,
                    factors: {
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
                },
            ];
            materialsData = flattenMaterialsDB(db);
            console.log("Materials processed.");

            armorVolumesList.forEach(item => {
                if (!armorVolumesData[item.ArmorPiece]) {
                    armorVolumesData[item.ArmorPiece] = {};
                }
                armorVolumesData[item.ArmorPiece][item.Component] = parseFloat(item.Volume_cm3);
            });
            console.log("Armor volumes processed.");

            shieldVolumesList.forEach(item => {
                if (!shieldVolumesData[item.ShieldType]) shieldVolumesData[item.ShieldType] = {};
                shieldVolumesData[item.ShieldType][item.Component] = parseFloat(item.Volume_cm3);
            });
            console.log("Shield volumes processed.");

            weaponVolumesList.forEach(item => {
                if (!weaponVolumesData[item.weapon_type]) weaponVolumesData[item.weapon_type] = {};
                weaponVolumesData[item.weapon_type][item.component_name] = parseFloat(item.volume_cm3);
            });
            console.log("Weapon volumes processed.");

            potionIngredientsData = potionIngredientsList.map(h => ({
                RowName: h.name.replace(/\s+/g, '_'),
                Name: h.name,
                factors: h.factors,
            }));
            enchantmentRunesData = enchantmentRunesList;
            alchemyRecipesData = alchemyRecipesList;
            console.log("Ingredients, runes, and recipes assigned.");

            bannedNames = bannedNamesText.split('\n').filter(name => name.trim() !== '').map(name => name.toLowerCase());
            console.log("Banned names processed.");

            populateAllDropdowns();
            console.log("Dropdowns populated.");
            setupAllEventListeners();
            console.log("Event listeners set up.");
            calculateAllResults();
            console.log("Initial results calculated. Load complete.");

        } catch (error) {
            console.error("Failed to load crafting data:", error);
            const allResultsDivs = [armorResultsDiv, shieldResultsDiv, weaponResultsDiv, bowResultsDiv, alchemyResultsDiv, enchantingResultsDiv, refiningResultsDiv, jewelryResultsDiv];
            allResultsDivs.forEach(div => {
                if(div) div.innerHTML = `<p class="text-red-400">Error loading crafting data. Please try again later.</p>`;
            });
        }
    }

    function buildMaterialDB(db, wood, elementals, alloys, rocks) {
        const slug = name => name.toLowerCase().replace(/\s+/g, '_');
        db['Wood'] = Object.fromEntries(
            Object.entries(wood).map(([type, list]) => [
                type,
                list.map(name => ({ id: slug(name), name }))
            ])
        );

        db['Rock Types'] = Object.fromEntries(
            Object.entries(rocks).map(([type, stones]) => [
                type,
                Object.keys(stones).map(name => ({ id: slug(name), name }))
            ])
        );

        const elementalMetals = (elementals.elements || []).map(m => ({ id: slug(m.name), name: m.name, factors: m.factors || {} }));
        const alloyMetals = (alloys.elements || []).map(m => ({ id: slug(m.name), name: m.name, factors: m.factors || {} }));

        db.Metals = db.Metals || {};
        db.Metals['Elemental Metals'] = elementalMetals;
        db.Metals['Metal Alloys'] = alloyMetals;

        const assignIds = obj => {
            for (const val of Object.values(obj)) {
                if (Array.isArray(val)) {
                    val.forEach(m => { if (m.name && !m.id) m.id = slug(m.name); });
                } else if (val && typeof val === 'object') {
                    assignIds(val);
                }
            }
        };
        assignIds(db);
        return db;
    }

    function flattenMaterialsDB(db) {
        const map = new Map();
        const expandFactors = (m) => {
            if (!m.factors) return {};
            const f = m.factors;
            return {
                slash: f.slash,
                pierce: f.pierce,
                blunt: f.blunt,
                defense_slash: f.defense_slash,
                defense_pierce: f.defense_pierce,
                defense_blunt: f.defense_blunt,
                fire: f.fire,
                water: f.water,
                wind: f.wind,
                earth: f.earth
            };
        };
        for (const [category, val] of Object.entries(db)) {
            if (Array.isArray(val)) {
                val.forEach(m => map.set(m.id, { ...m, ...expandFactors(m), rowName: m.id, Category: category }));
            } else {
                for (const [sub, arr] of Object.entries(val)) {
                    arr.forEach(m => map.set(m.id, { ...m, ...expandFactors(m), rowName: m.id, Category: category, SubCategory: sub }));
                }
            }
        }
        return map;
    }

    function populateAllDropdowns() {
        populateArmorDropdowns();
        populateShieldDropdowns();
        populateWeaponDropdowns();
        populateBowyerDropdowns();
        populateAlchemyDropdowns();
        populateEnchantingDropdowns();
        populateRefiningDropdowns();
        populateJewelryDropdowns();
    }

    function setupAllEventListeners() {
        [armorPieceSelect, armorClassSelect, outerMaterialSelect, innerMaterialSelect, bindingMaterialSelect, armorNameInput, outerCategorySelect, innerCategorySelect, bindingCategorySelect].forEach(el => el.addEventListener('change', () => {
            if (el === outerCategorySelect) {
                const mats = Array.from(materialsData.values()).filter(m => m.Category === outerCategorySelect.value);
                populateSelectWithOptions(outerMaterialSelect, mats);
            }
            if (el === innerCategorySelect) {
                const mats = Array.from(materialsData.values()).filter(m => m.Category === innerCategorySelect.value);
                populateSelectWithOptions(innerMaterialSelect, mats);
            }
            if (el === bindingCategorySelect) {
                const mats = Array.from(materialsData.values()).filter(m => m.Category === bindingCategorySelect.value);
                populateSelectWithOptions(bindingMaterialSelect, mats);
            }
            calculateAndDisplayArmorResults();
        }));
        [shieldTypeSelect, shieldBodyCategorySelect, shieldBodyMaterialSelect, shieldBossCategorySelect, shieldBossMaterialSelect, shieldRimCategorySelect, shieldRimMaterialSelect].forEach(el => el.addEventListener('change', calculateAndDisplayShieldResults));
        weaponTypeSelect.addEventListener('change', () => {
            populateWeaponComponents();
            calculateAndDisplayWeaponResults();
        });
        weaponNameInput.addEventListener('change', calculateAndDisplayWeaponResults);
        weaponHandedRadios.forEach(r => r.addEventListener('change', calculateAndDisplayWeaponResults));
        bowTypeSelect.addEventListener('change', () => {
            populateBowComponents();
            calculateAndDisplayBowResults();
        });
        [ingredient1Select, ingredient2Select].forEach(el => el.addEventListener('change', calculateAndDisplayAlchemyResults));
        [rune1Select, rune2Select].forEach(el => el.addEventListener('change', calculateAndDisplayEnchantingResults));
        roughGemstoneSelect.addEventListener('change', calculateAndDisplayRefiningResults);
        [jewelryTypeSelect, jewelryMetalSelect, document.getElementById('jewelry-attribute')].forEach(el => el.addEventListener('change', calculateAndDisplayJewelryResults));
    }

    function calculateAllResults() {
        calculateAndDisplayArmorResults();
        calculateAndDisplayShieldResults();
        populateWeaponComponents(); // Initial population
        calculateAndDisplayWeaponResults();
        populateBowComponents(); // Initial population
        calculateAndDisplayBowResults();
        calculateAndDisplayAlchemyResults();
        calculateAndDisplayEnchantingResults();
        calculateAndDisplayRefiningResults();
        calculateAndDisplayJewelryResults();
    }

    // --- Population Functions ---
    function populateSelectWithOptions(selectElement, options) {
        selectElement.innerHTML = '';
        options.forEach(option => addOption(selectElement, option.name, option.rowName));
    }

    function populateArmorDropdowns() {
        armorPieceSelect.innerHTML = '';
        outerCategorySelect.innerHTML = '';
        innerCategorySelect.innerHTML = '';
        bindingCategorySelect.innerHTML = '';

        Object.keys(armorVolumesData).forEach(piece => addOption(armorPieceSelect, piece, piece));

        const allMaterials = Array.from(materialsData.values());
        const allCategories = [...new Set(allMaterials.map(m => m.Category))].sort();

        const updateOuterCategories = () => {
            outerCategorySelect.innerHTML = '';
            const allowed = MATERIALS_FOR_CLASS[armorClassSelect.value] || [];
            allowed.forEach(cat => { if(allCategories.includes(cat)) addOption(outerCategorySelect, cat, cat); });
            const mats = allMaterials.filter(m => m.Category === outerCategorySelect.value);
            populateSelectWithOptions(outerMaterialSelect, mats);
        };

        MATERIALS_FOR_INNER.forEach(cat => { if(allCategories.includes(cat)) addOption(innerCategorySelect, cat, cat); });
        MATERIALS_FOR_BINDING.forEach(cat => { if(allCategories.includes(cat)) addOption(bindingCategorySelect, cat, cat); });

        const populateByCat = (catSel, matSel) => {
            const mats = allMaterials.filter(m => m.Category === catSel.value);
            populateSelectWithOptions(matSel, mats);
        };

        updateOuterCategories();
        populateByCat(innerCategorySelect, innerMaterialSelect);
        populateByCat(bindingCategorySelect, bindingMaterialSelect);

        armorClassSelect.addEventListener('change', () => {
            updateOuterCategories();
            calculateAndDisplayArmorResults();
        });
    }

    function populateShieldDropdowns() {
        Object.keys(shieldVolumesData).forEach(type => addOption(shieldTypeSelect, type, type));

        const allMaterials = Array.from(materialsData.values());
        const allCategories = [...new Set(allMaterials.map(m => m.Category))].sort();

        allCategories.forEach(cat => {
            addOption(shieldBodyCategorySelect, cat, cat);
            addOption(shieldBossCategorySelect, cat, cat);
            addOption(shieldRimCategorySelect, cat, cat);
        });

        const populateByCat = (catSel, matSel) => {
            const mats = allMaterials.filter(m => m.Category === catSel.value);
            populateSelectWithOptions(matSel, mats);
        };

        populateByCat(shieldBodyCategorySelect, shieldBodyMaterialSelect);
        populateByCat(shieldBossCategorySelect, shieldBossMaterialSelect);
        populateByCat(shieldRimCategorySelect, shieldRimMaterialSelect);

        [
            [shieldBodyCategorySelect, shieldBodyMaterialSelect],
            [shieldBossCategorySelect, shieldBossMaterialSelect],
            [shieldRimCategorySelect, shieldRimMaterialSelect]
        ].forEach(([catSel, matSel]) => {
            catSel.addEventListener('change', () => populateByCat(catSel, matSel));
        });
    }

    function populateWeaponDropdowns() {
        const weaponTypes = ["Sword", "Axe", "Hammer", "Spear", "Dagger", "Lance"];
        weaponTypes.forEach(type => addOption(weaponTypeSelect, type, type));
    }

    const BOW_VOLUMES = {
        Long:    { Stave: 1300 },
        Recurve: { Stave: 1100 },
        Yumi:    { Stave: 1200 },
        Horse:   { Stave: 900 },
        Flat:    { Stave: 1000 },
    };

    const GEMSTONES = [
        { name: "Diamond", rowName: "Rock Types_T5_Diamond", rough: "Rough Diamond", cut: "Cut Diamond" },
        { name: "Ruby", rowName: "Rock Types_T5_Ruby", rough: "Rough Ruby", cut: "Cut Ruby" },
        { name: "Sapphire", rowName: "Rock Types_T5_Sapphire", rough: "Rough Sapphire", cut: "Cut Sapphire" },
        { name: "Emerald", rowName: "Rock Types_T4_Emerald", rough: "Rough Emerald", cut: "Cut Emerald" },
        { name: "Topaz", rowName: "Rock Types_T4_Topaz", rough: "Rough Topaz", cut: "Cut Topaz" },
        { name: "Garnet", rowName: "Rock Types_T3_Garnet", rough: "Rough Garnet", cut: "Cut Garnet" },
        { name: "Quartz", rowName: "Rock Types_T1_Quartz", rough: "Rough Quartz", cut: "Cut Quartz" },
    ];

    function populateBowyerDropdowns() {
        const bowTypes = ["Long", "Recurve", "Yumi", "Horse", "Flat"];
        bowTypes.forEach(type => addOption(bowTypeSelect, type, type));
    }

    function populateAlchemyDropdowns() {
        console.log("Populating alchemy dropdowns with:", potionIngredientsData);
        potionIngredientsData.forEach(i => addOption(ingredient1Select, i.Name, i.RowName));
        potionIngredientsData.forEach(i => addOption(ingredient2Select, i.Name, i.RowName));
    }

    function populateEnchantingDropdowns() {
        enchantmentRunesData.forEach(r => addOption(rune1Select, r.Name, r.RowName));
        enchantmentRunesData.forEach(r => addOption(rune2Select, r.Name, r.RowName));
    }

    function populateRefiningDropdowns() {
        if (!roughGemstoneSelect) return;
        GEMSTONES.forEach(gem => addOption(roughGemstoneSelect, gem.rough, gem.rowName));
    }

    function populateWeaponComponents() {
        const type = weaponTypeSelect.value;
        weaponComponentsDiv.innerHTML = '';
        if (!type || !weaponVolumesData[type]) return;

        const allMaterials = Array.from(materialsData.values());
        const allCategories = [...new Set(allMaterials.map(m => m.Category))].sort();

        const isHeadComponent = name => {
            const l = name.toLowerCase();
            return ['head','blade','pouch','bow'].some(k => l.includes(k));
        };
        const allowedCategoriesFor = name => {
            const l = name.toLowerCase();
            if (['handle','shaft','stock'].some(k => l.includes(k))) return MATERIALS_FOR_HANDLE_CORE;
            if (['grip','cord','string'].some(k => l.includes(k))) return MATERIALS_FOR_HANDLE_GRIP;
            if (['guard','pommel','butt'].some(k => l.includes(k))) return MATERIALS_FOR_HANDLE_FITTING;
            if (isHeadComponent(name)) return MATERIALS_FOR_HEAD;
            return allCategories;
        };

        Object.keys(weaponVolumesData[type]).forEach(comp => {
            const slug = comp.toLowerCase().replace(' ', '-');
            const catId = `weapon-comp-${slug}-category`;
            const matId = `weapon-comp-${slug}-material`;
            const headComp = isHeadComponent(comp);
            const allowedCats = allowedCategoriesFor(comp);

            const catLabel = createLabel(`${comp} Category`, catId);
            const catSelect = document.createElement('select');
            catSelect.id = catId;
            catSelect.className = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white";
            allowedCats.forEach(cat => addOption(catSelect, cat, cat));

            const matLabel = createLabel(comp, matId);
            const initialMats = allMaterials.filter(m => m.Category === catSelect.value && (!headComp || !BANNED_WEAPON_HEAD_MATERIALS.includes(m.name)));
            const matSelect = createMaterialSelect(matId, initialMats);

            catSelect.addEventListener('change', () => {
                let mats = allMaterials.filter(m => m.Category === catSelect.value);
                if (headComp) mats = mats.filter(m => !BANNED_WEAPON_HEAD_MATERIALS.includes(m.name));
                populateSelectWithOptions(matSelect, mats);
                calculateAndDisplayWeaponResults();
            });
            matSelect.addEventListener('change', calculateAndDisplayWeaponResults);

            weaponComponentsDiv.appendChild(catLabel);
            weaponComponentsDiv.appendChild(catSelect);
            weaponComponentsDiv.appendChild(matLabel);
            weaponComponentsDiv.appendChild(matSelect);
        });
    }

    function populateBowComponents() {
        bowComponentsDiv.innerHTML = '';
        const allMaterials = Array.from(materialsData.values()).filter(m => m.Category === 'Wood' || m.Category === 'Dev');
        const categories = [...new Set(allMaterials.map(m => m.Category))].sort();

        const catId = 'bow-comp-stave-category';
        const matId = 'bow-comp-stave-material';

        const catLabel = createLabel('Stave Category', catId);
        const catSelect = document.createElement('select');
        catSelect.id = catId;
        catSelect.className = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white";
        categories.forEach(cat => addOption(catSelect, cat, cat));

        const matLabel = createLabel('Stave Material', matId);
        const initialMats = allMaterials.filter(m => m.Category === catSelect.value);
        const matSelect = createMaterialSelect(matId, initialMats);

        catSelect.addEventListener('change', () => {
            const mats = allMaterials.filter(m => m.Category === catSelect.value);
            populateSelectWithOptions(matSelect, mats);
            calculateAndDisplayBowResults();
        });
        matSelect.addEventListener('change', calculateAndDisplayBowResults);

        bowComponentsDiv.appendChild(catLabel);
        bowComponentsDiv.appendChild(catSelect);
        bowComponentsDiv.appendChild(matLabel);
        bowComponentsDiv.appendChild(matSelect);
    }

    // --- Calculation Functions ---
    function validateName(name) {
        if (!name) return true; // Empty name is valid
        const lowerCaseName = name.toLowerCase();
        return !bannedNames.some(bannedWord => lowerCaseName.includes(bannedWord));
    }

    function formatArmorResults({ requiredMaterials, totalMass, defenses, piece, armorClass, name }) {
        let materialsList = '';
        for (const name in requiredMaterials) {
            materialsList += `<li>${name}: ${requiredMaterials[name].units.toFixed(2)} units of ${requiredMaterials[name].name}</li>`;
        }

        let defenseList = '';
        for (const [key, value] of Object.entries(defenses)) {
            defenseList += `<li>${key}: ${(value * 100).toFixed(1)}%</li>`;
        }

        return `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafted Item:</h5>
            <p>${name || `[${armorClass}] [${piece}]`}</p>

            <h5 class="text-md font-semibold text-emerald-400 mt-4">Defensive Stats:</h5>
            <ul class="list-disc list-inside">${defenseList}</ul>

            <h5 class="text-md font-semibold text-emerald-400 mt-4">Required Materials:</h5>
            <ul class="list-disc list-inside">${materialsList}</ul>

            <h5 class="text-md font-semibold text-emerald-400 mt-2">Item Stats:</h5>
            <p>Estimated Mass: ${totalMass.toFixed(2)} kg</p>
        `;
    }

    function calculateAndDisplayArmorResults() {
        const piece = armorPieceSelect.value;
        const armorClass = armorClassSelect.value;
        const armorName = armorNameInput.value;
        const outerMat = findMaterial(outerMaterialSelect.value);
        const innerMat = findMaterial(innerMaterialSelect.value);
        const bindingMat = findMaterial(bindingMaterialSelect.value);

        if (!piece || !armorClass || !outerMat || !innerMat || !bindingMat) return;

        const isNameValid = validateName(armorName);
        if (!isNameValid) {
            armorResultsDiv.innerHTML = '<p class="text-red-400">This name is not allowed. Please choose another.</p>';
            return;
        }

        const volumes = armorVolumesData[piece];
        const physicalStats = calculatePhysicalItemStats({
            Outer: { material: outerMat, volume: volumes.Outer },
            Inner: { material: innerMat, volume: volumes.Inner },
            Binding: { material: bindingMat, volume: volumes.Binding }
        });

        const wOuter = 0.80, wInner = 0.15, wBind = 0.05;
        const physMul = (m, type) => (parseFloat(m[type]) || 0) * (parseFloat(m[`defense_${type}`]) || 0);
        const outerPhys = { slash: physMul(outerMat,'slash'), pierce: physMul(outerMat,'pierce'), blunt: physMul(outerMat,'blunt') };
        const innerPhys = { slash: physMul(innerMat,'slash'), pierce: physMul(innerMat,'pierce'), blunt: physMul(innerMat,'blunt') };
        const bindPhys  = { slash: physMul(bindingMat,'slash'), pierce: physMul(bindingMat,'pierce'), blunt: physMul(bindingMat,'blunt') };
        const avgMagic = m => ((parseFloat(m.fire)||0)+(parseFloat(m.water)||0)+(parseFloat(m.wind)||0)+(parseFloat(m.earth)||0))/4;
        const combinedSlash = (outerPhys.slash * wOuter) + (innerPhys.slash * wInner) + (bindPhys.slash * wBind);
        const combinedPierce = (outerPhys.pierce * wOuter) + (innerPhys.pierce * wInner) + (bindPhys.pierce * wBind);
        const combinedBlunt = (outerPhys.blunt * wOuter) + (innerPhys.blunt * wInner) + (bindPhys.blunt * wBind);
        const combinedMagic = (avgMagic(outerMat) * wOuter) + (avgMagic(innerMat) * wInner) + (avgMagic(bindingMat) * wBind);

        const base = ARMOR_CLASS[armorClass];
        const defenses = {
            Slash: Math.min(0.95, base.physical * combinedSlash),
            Pierce: Math.min(0.95, base.physical * combinedPierce),
            Blunt: Math.min(0.95, base.physical * combinedBlunt),
            Magic: Math.min(0.95, base.magical * combinedMagic),
        };

        armorResultsDiv.innerHTML = formatArmorResults({
            ...physicalStats,
            defenses,
            piece,
            armorClass,
            name: armorName,
        });
    }

    function calculateAndDisplayShieldResults() {
        const type = shieldTypeSelect.value;
        const bodyMat = findMaterial(shieldBodyMaterialSelect.value);
        const bossMat = findMaterial(shieldBossMaterialSelect.value);
        const rimMat = findMaterial(shieldRimMaterialSelect.value);

        if (!type || !bodyMat || !bossMat || !rimMat) return;

        const volumes = shieldVolumesData[type];
        const components = { Body: { material: bodyMat, volume: volumes.Body } };
        if(volumes.Boss) components.Boss = { material: bossMat, volume: volumes.Boss };
        if(volumes.Rim) components.Rim = { material: rimMat, volume: volumes.Rim };

        const result = calculatePhysicalItemStats(components);
        shieldResultsDiv.innerHTML = formatResults(result);
    }

    function formatWeaponResults({ requiredMaterials, totalMass, damageMod, weaponInfo, type, name, handedness }) {
        let materialsList = '';
        for (const matName in requiredMaterials) {
            materialsList += `<li>${matName}: ${requiredMaterials[matName].units.toFixed(2)} units of ${requiredMaterials[matName].name}</li>`;
        }

        let damageTypeList = '';
        if (weaponInfo && weaponInfo.head) {
            for (const [key, value] of Object.entries(weaponInfo.head)) {
                damageTypeList += `<li>${key}: ${value}</li>`;
            }
        }

        return `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafted Item:</h5>
            <p>${name || `[${type}]`}</p>

            <h5 class="text-md font-semibold text-emerald-400 mt-4">Base Damage Multipliers:</h5>
            <ul class="list-disc list-inside">${damageTypeList}</ul>

            <h5 class="text-md font-semibold text-emerald-400 mt-2">Head Material Damage Modifier:</h5>
            <p>${damageMod.toFixed(2)}</p>

            <h5 class="text-md font-semibold text-emerald-400 mt-4">Required Materials:</h5>
            <ul class="list-disc list-inside">${materialsList}</ul>

            <h5 class="text-md font-semibold text-emerald-400 mt-2">Item Stats:</h5>
            <p>Estimated Mass: ${totalMass.toFixed(2)} kg</p>
            <p>Handedness: ${handedness}</p>
        `;
    }

    function calculateAndDisplayWeaponResults() {
        const type = weaponTypeSelect.value;
        const weaponName = weaponNameInput.value;
        if (!type || !weaponVolumesData[type]) return;

        const isNameValid = validateName(weaponName);
        if (!isNameValid) {
            weaponResultsDiv.innerHTML = '<p class="text-red-400">This name is not allowed. Please choose another.</p>';
            return;
        }

        const components = getComponentData(weaponComponentsDiv, 'weapon-comp-');
        if(!components) return;

        const result = calculatePhysicalItemStats(components);

        const headMat = components['Head'] ? components['Head'].material : null;
        let damageMod = 0;
        if (headMat) {
            damageMod = ((parseFloat(headMat.slash) || 0) + (parseFloat(headMat.pierce) || 0)) / 4;
        }

        const weaponInfo = WEAPONS[type];

        const handedness = document.querySelector('input[name="weapon-handed"]:checked').value;

        weaponResultsDiv.innerHTML = formatWeaponResults({
            ...result,
            damageMod,
            weaponInfo,
            type,
            name: weaponName,
            handedness,
        });
    }

    function calculateAndDisplayBowResults() {
        const type = bowTypeSelect.value;
        if (!type) return;

        const woodSelect = document.getElementById('bow-comp-stave-material');
        if (!woodSelect) return;

        const woodMaterial = findMaterial(woodSelect.value);
        if (!woodMaterial) return;

        const volume = BOW_VOLUMES[type].Stave;
        const density = parseFloat(woodMaterial.density);
        const mass = volume * density;
        const requiredUnits = mass / 100;

        const result = {
            requiredMaterials: {
                "Stave": { name: woodMaterial.Name, volume, units: requiredUnits }
            },
            totalMass: mass / 1000
        };

        bowResultsDiv.innerHTML = formatResults(result);
    }

    // ... inside loadData ...

    function calculateAndDisplayAlchemyResults() {
        const ing1 = ingredient1Select.value;
        const ing2 = ingredient2Select.value;
        if (!ing1 || !ing2) return;

        const provided_ingredients = [ing1, ing2].sort();

        const recipe = alchemyRecipesData.find(r => {
            const recipe_ingredients = [...r.ingredients].sort();
            return recipe_ingredients[0] === provided_ingredients[0] && recipe_ingredients[1] === provided_ingredients[1];
        });

        if (recipe) {
            let propertiesList = '';
            for (const [key, value] of Object.entries(recipe.properties)) {
                propertiesList += `<li>${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}</li>`;
            }

            alchemyResultsDiv.innerHTML = `
                <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafted Item:</h5>
                <p><strong>Name:</strong> ${recipe.name}</p>
                <p><strong>Type:</strong> ${recipe.type}</p>
                <p><strong>Effect:</strong> ${recipe.effect}</p>
                <h5 class="text-md font-semibold text-emerald-400 mt-2">Properties:</h5>
                <ul class="list-disc list-inside">${propertiesList}</ul>
            `;
        } else {
            alchemyResultsDiv.innerHTML = `
                <p class="text-orange-400 mt-4">These ingredients cannot be combined.</p>
            `;
        }
    }

    function calculateAndDisplayEnchantingResults() {
        const rune1 = findRune(rune1Select.value);
        const rune2 = findRune(rune2Select.value);
        if (!rune1 || !rune2) return;

        enchantingResultsDiv.innerHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafted Enchantment:</h5>
            <p>Name: Enchantment of ${rune1.Name} and ${rune2.Name}</p>
            <p>Effect: Combines the powers of ${rune1.Effect} and ${rune2.Effect}.</p>
        `;
    }

    function calculateAndDisplayRefiningResults() {
        if (!roughGemstoneSelect) return;
        const selectedGemRow = roughGemstoneSelect.value;
        const gem = GEMSTONES.find(g => g.rowName === selectedGemRow);
        if (!gem) return;

        // Assuming a 1:1 ratio for rough to cut for now.
        refiningResultsDiv.innerHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Refining Result:</h5>
            <p>1 x ${gem.rough}  ->  1 x ${gem.cut}</p>
        `;
    }

    function populateJewelryDropdowns() {
        if (!jewelryTypeSelect) return;
        const metalMaterials = Array.from(materialsData.values()).filter(m => m.Category === 'Elemental Metals' || m.Category === 'Metal Alloys' || m.Category === 'Dev');
        populateSelectWithOptions(jewelryMetalSelect, metalMaterials);
    }

    function calculateAndDisplayJewelryResults() {
        if (!jewelryTypeSelect) return;
        const itemType = jewelryTypeSelect.value;
        const metalMaterial = findMaterial(jewelryMetalSelect.value);
        const attributeSelect = document.getElementById('jewelry-attribute');

        if (!itemType || !metalMaterial) return;

        // Show/hide attribute dropdown
        if (itemType === 'Ring' || itemType === 'Earring') {
            attributeSelect.parentElement.style.display = 'block';
        } else {
            attributeSelect.parentElement.style.display = 'none';
        }

        const toughness = (parseFloat(metalMaterial.slash) + parseFloat(metalMaterial.pierce) + parseFloat(metalMaterial.blunt)) / 3;
        const durability = toughness * 100;

        let attribute = '';
        let modifier = 0;
        let skill = '';
        let skillIncrease = 0;

        if (itemType === 'Ring' || itemType === 'Earring') {
            attribute = attributeSelect.value;
            modifier = 1; // Default bonus
        } else if (itemType === 'Amulet') {
            const skills = [
                "ArmorTraining", "BlockingAndShields", "Sword", "Axe", "Dagger", "Hammer", "Polesword",
                "Poleaxe", "Spear", "MountedCombat", "MountedArchery", "MountedMagery", "Anatomy",
                "BeastControl", "Taming", "Fire", "Water", "Earth", "Wind", "Radiance", "Void",
                "Stealth", "MeleeAmbush", "RangedAmbush", "ElementalAmbush"
            ];
            skill = skills[Math.floor(Math.random() * skills.length)];
            skillIncrease = Math.floor(Math.random() * 10) + 1;
        }

        let resultsHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafted ${itemType}:</h5>
            <p><strong>Material:</strong> ${metalMaterial.name}</p>
            <p><strong>Durability:</strong> ${durability.toFixed(2)}</p>
        `;

        if (itemType === 'Ring' || itemType === 'Earring') {
            resultsHTML += `<p><strong>Bonus:</strong> +${modifier} ${attribute}</p>`;
        } else if (itemType === 'Amulet') {
            resultsHTML += `<p><strong>Bonus:</strong> +${skillIncrease} to ${skill}</p>`;
        }

        jewelryResultsDiv.innerHTML = resultsHTML;
    }

    function calculatePhysicalItemStats(components) {
        let totalMass = 0;
        const requiredMaterials = {};

        for(const name in components) {
            const comp = components[name];
            const density = parseFloat(comp.material.Density);
            totalMass += comp.volume * density;
            requiredMaterials[name] = {
                name: comp.material.Name,
                volume: comp.volume,
                units: (comp.volume * density) / 100
            };
        }

        return { requiredMaterials, totalMass: totalMass / 1000 };
    }

    // --- Helpers ---
    function addOption(select, text, value) {
        const option = document.createElement('option');
        option.textContent = text;
        option.value = value;
        select.appendChild(option);
    }

    function createLabel(text, forId) {
        const label = document.createElement('label');
        label.htmlFor = forId;
        label.className = "block text-sm font-medium text-slate-300";
        label.textContent = text;
        return label;
    }

    function createMaterialSelect(id, materials = Array.from(materialsData.values())) {
        const select = document.createElement('select');
        select.id = id;
        select.className = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white";
        populateSelectWithOptions(select, materials);
        return select;
    }

    function findMaterial(rowName) { return materialsData.get(rowName); }
    function findIngredient(rowName) { return potionIngredientsData.find(i => i.RowName === rowName); }
    function findRune(rowName) { return enchantmentRunesData.find(r => r.RowName === rowName); }

    function getComponentData(container, prefix) {
        const components = {};
        const selects = container.querySelectorAll(`select[id^="${prefix}"][id$="-material"]`);
        for (const select of selects) {
            const compName = select.id
                .replace(prefix, '')
                .replace('-material', '')
                .replace(/-/g, ' ');
            const material = findMaterial(select.value);
            if(!material) return null; // Incomplete selection
            const type = weaponTypeSelect.value;
            const volume = weaponVolumesData[type][
                Object.keys(weaponVolumesData[type]).find(k => k.toLowerCase() === compName)
            ];
            components[compName.charAt(0).toUpperCase() + compName.slice(1)] = { material, volume };
        }
        return components;
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
