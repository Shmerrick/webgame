document.addEventListener('DOMContentLoaded', () => {
    // Common
    let materialsData = [];
    let bannedNames = [];

    const ARMOR_CLASS = {
        Light:  { physical: 0.45, magical: 0.45 },
        Medium: { physical: 0.65, magical: 0.65 },
        Heavy:  { physical: 0.85, magical: 0.85 },
    };

    // Armor
    const armorPieceSelect = document.getElementById('armor-piece');
    const armorClassSelect = document.getElementById('armor-class');
    const armorNameInput = document.getElementById('armor-name');
    const outerMaterialSelect = document.getElementById('outer-material');
    const innerMaterialSelect = document.getElementById('inner-material');
    const bindingMaterialSelect = document.getElementById('binding-material');
    const armorResultsDiv = document.getElementById('crafting-results');
    let armorVolumesData = {};

    // Shield
    const shieldTypeSelect = document.getElementById('shield-type');
    const shieldBodyMaterialSelect = document.getElementById('shield-body-material');
    const shieldBossMaterialSelect = document.getElementById('shield-boss-material');
    const shieldRimMaterialSelect = document.getElementById('shield-rim-material');
    const shieldResultsDiv = document.getElementById('shield-crafting-results');
    let shieldVolumesData = {};

    // Weapon
    const weaponTypeSelect = document.getElementById('weapon-type');
    const weaponNameInput = document.getElementById('weapon-name');
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
    const jewelryGemstoneSelect = document.getElementById('jewelry-gemstone');
    const jewelryResultsDiv = document.getElementById('jewelry-results');

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

    // Utility to parse CSV data
    function parseCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        const header = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return header.reduce((obj, key, index) => {
                obj[key] = values[index] ? values[index].trim() : '';
                return obj;
            }, {});
        });
    }

    // Fetch and process data
    async function loadData() {
        try {
            // Fetch materials
            const materialsResponse = await fetch('/materials.csv');
            const materialsCsv = await materialsResponse.text();
            materialsData = parseCSV(materialsCsv);

            // Fetch armor volumes
            const armorVolumesResponse = await fetch('/armor_volumes.csv');
            const armorVolumesCsv = await armorVolumesResponse.text();
            const parsedArmorVolumes = parseCSV(armorVolumesCsv);

            // Restructure armor volumes for easy lookup
            parsedArmorVolumes.forEach(item => {
                if (!armorVolumesData[item.ArmorPiece]) {
                    armorVolumesData[item.ArmorPiece] = {};
                }
                armorVolumesData[item.ArmorPiece][item.Component] = parseFloat(item.Volume_cm3);
            });

            // Fetch shield volumes
            const shieldVolumesResponse = await fetch('/shield_volumes.csv');
            const shieldVolumesCsv = await shieldVolumesResponse.text();
            const parsedShieldVolumes = parseCSV(shieldVolumesCsv);
            parsedShieldVolumes.forEach(item => {
                if (!shieldVolumesData[item.ShieldType]) shieldVolumesData[item.ShieldType] = {};
                shieldVolumesData[item.ShieldType][item.Component] = parseFloat(item.Volume_cm3);
            });

            // Fetch weapon volumes
            const weaponVolumesResponse = await fetch('/weapon_volumes.csv');
            const weaponVolumesCsv = await weaponVolumesResponse.text();
            const parsedWeaponVolumes = parseCSV(weaponVolumesCsv);
            parsedWeaponVolumes.forEach(item => {
                if (!weaponVolumesData[item.weapon_type]) weaponVolumesData[item.weapon_type] = {};
                weaponVolumesData[item.weapon_type][item.component_name] = parseFloat(item.volume_cm3);
            });

            // Fetch potion ingredients
            const ingredientsResponse = await fetch('/potion_ingredients.csv');
            const ingredientsCsv = await ingredientsResponse.text();
            potionIngredientsData = parseCSV(ingredientsCsv);

            // Fetch enchantment runes
            const runesResponse = await fetch('/enchantment_runes.csv');
            const runesCsv = await runesResponse.text();
            enchantmentRunesData = parseCSV(runesCsv);

            // Fetch banned names
            const bannedNamesResponse = await fetch('/banned_names.txt');
            const bannedNamesText = await bannedNamesResponse.text();
            bannedNames = bannedNamesText.split('\n').filter(name => name.trim() !== '').map(name => name.toLowerCase());

            populateAllDropdowns();
            setupAllEventListeners();
            calculateAllResults();

        } catch (error) {
            console.error("Failed to load crafting data:", error);
            const allResultsDivs = [armorResultsDiv, shieldResultsDiv, weaponResultsDiv, bowResultsDiv, alchemyResultsDiv, enchantingResultsDiv, refiningResultsDiv, jewelryResultsDiv];
            allResultsDivs.forEach(div => {
                if(div) div.innerHTML = `<p class="text-red-400">Error loading crafting data. Please try again later.</p>`;
            });
        }
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
        [armorPieceSelect, armorClassSelect, outerMaterialSelect, innerMaterialSelect, bindingMaterialSelect, armorNameInput].forEach(el => el.addEventListener('change', calculateAndDisplayArmorResults));
        [shieldTypeSelect, shieldBodyMaterialSelect, shieldBossMaterialSelect, shieldRimMaterialSelect].forEach(el => el.addEventListener('change', calculateAndDisplayShieldResults));
        weaponTypeSelect.addEventListener('change', () => {
            populateWeaponComponents();
            calculateAndDisplayWeaponResults();
        });
        weaponNameInput.addEventListener('change', calculateAndDisplayWeaponResults);
        bowTypeSelect.addEventListener('change', () => {
            populateBowComponents();
            calculateAndDisplayBowResults();
        });
        [ingredient1Select, ingredient2Select].forEach(el => el.addEventListener('change', calculateAndDisplayAlchemyResults));
        [rune1Select, rune2Select].forEach(el => el.addEventListener('change', calculateAndDisplayEnchantingResults));
        roughGemstoneSelect.addEventListener('change', calculateAndDisplayRefiningResults);
        [jewelryTypeSelect, jewelryMetalSelect, jewelryGemstoneSelect].forEach(el => el.addEventListener('change', calculateAndDisplayJewelryResults));
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
    function populateArmorDropdowns() {
        Object.keys(armorVolumesData).forEach(piece => addOption(armorPieceSelect, piece, piece));
        materialsData.forEach(m => addOption(outerMaterialSelect, m.Name, m.RowName));
        materialsData.forEach(m => addOption(innerMaterialSelect, m.Name, m.RowName));
        materialsData.forEach(m => addOption(bindingMaterialSelect, m.Name, m.RowName));
    }

    function populateShieldDropdowns() {
        Object.keys(shieldVolumesData).forEach(type => addOption(shieldTypeSelect, type, type));
        materialsData.forEach(m => addOption(shieldBodyMaterialSelect, m.Name, m.RowName));
        materialsData.forEach(m => addOption(shieldBossMaterialSelect, m.Name, m.RowName));
        materialsData.forEach(m => addOption(shieldRimMaterialSelect, m.Name, m.RowName));
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
        { name: "Diamond", rowName: "Minerals_T5_Diamond", rough: "Rough Diamond", cut: "Cut Diamond" },
        { name: "Ruby", rowName: "Minerals_T5_Ruby", rough: "Rough Ruby", cut: "Cut Ruby" },
        { name: "Sapphire", rowName: "Minerals_T5_Sapphire", rough: "Rough Sapphire", cut: "Cut Sapphire" },
        { name: "Emerald", rowName: "Minerals_T4_Emerald", rough: "Rough Emerald", cut: "Cut Emerald" },
        { name: "Topaz", rowName: "Minerals_T4_Topaz", rough: "Rough Topaz", cut: "Cut Topaz" },
        { name: "Garnet", rowName: "Minerals_T3_Garnet", rough: "Rough Garnet", cut: "Cut Garnet" },
        { name: "Quartz", rowName: "Minerals_T1_Quartz", rough: "Rough Quartz", cut: "Cut Quartz" },
    ];

    const JEWELRY_VOLUMES = {
        Ring: { Metal: 50, Gemstone: 5 },
        Necklace: { Metal: 150, Gemstone: 10 },
        Amulet: { Metal: 100, Gemstone: 15 },
    };

    function populateBowyerDropdowns() {
        const bowTypes = ["Long", "Recurve", "Yumi", "Horse", "Flat"];
        bowTypes.forEach(type => addOption(bowTypeSelect, type, type));
    }

    function populateAlchemyDropdowns() {
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

        Object.keys(weaponVolumesData[type]).forEach(comp => {
            const id = `weapon-comp-${comp.toLowerCase().replace(' ', '-')}`;
            const label = createLabel(comp, id);
            const select = createMaterialSelect(id);
            select.addEventListener('change', calculateAndDisplayWeaponResults);
            weaponComponentsDiv.appendChild(label);
            weaponComponentsDiv.appendChild(select);
        });
    }

    function populateBowComponents() {
        bowComponentsDiv.innerHTML = '';
        const id = `bow-comp-wood`;
        const label = createLabel("Wood", id);
        const select = createWoodMaterialSelect(id);
        select.addEventListener('change', calculateAndDisplayBowResults);
        bowComponentsDiv.appendChild(label);
        bowComponentsDiv.appendChild(select);
    }

    function createWoodMaterialSelect(id) {
        const select = document.createElement('select');
        select.id = id;
        select.className = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white";
        materialsData.filter(m => m.Category === 'Wood').forEach(m => addOption(select, m.Name, m.RowName));
        return select;
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
        const combinedSlash = (parseFloat(outerMat.Slash) * wOuter) + (parseFloat(innerMat.Slash) * wInner) + (parseFloat(bindingMat.Slash) * wBind);
        const combinedPierce = (parseFloat(outerMat.Pierce) * wOuter) + (parseFloat(innerMat.Pierce) * wInner) + (parseFloat(bindingMat.Pierce) * wBind);
        const combinedBlunt = (parseFloat(outerMat.Blunt) * wOuter) + (parseFloat(innerMat.Blunt) * wInner) + (parseFloat(bindingMat.Blunt) * wBind);
        const combinedMagic = (parseFloat(outerMat.Magic) * wOuter) + (parseFloat(innerMat.Magic) * wInner) + (parseFloat(bindingMat.Magic) * wBind);

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

    function formatWeaponResults({ requiredMaterials, totalMass, damageMod, weaponInfo, type, name }) {
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
            damageMod = ((parseFloat(headMat.Slash) || 0) + (parseFloat(headMat.Pierce) || 0)) / 4;
        }

        const weaponInfo = WEAPONS[type];

        weaponResultsDiv.innerHTML = formatWeaponResults({
            ...result,
            damageMod,
            weaponInfo,
            type,
            name: weaponName,
        });
    }

    function calculateAndDisplayBowResults() {
        const type = bowTypeSelect.value;
        if (!type) return;

        const woodSelect = document.getElementById('bow-comp-wood');
        if (!woodSelect) return;

        const woodMaterial = findMaterial(woodSelect.value);
        if (!woodMaterial) return;

        const volume = BOW_VOLUMES[type].Stave;
        const density = parseFloat(woodMaterial.Density);
        const mass = volume * density;
        const requiredUnits = mass / 100;

        const result = {
            requiredMaterials: {
                "Stave": { name: woodMaterial.Name, units: requiredUnits }
            },
            totalMass: mass / 1000
        };

        bowResultsDiv.innerHTML = formatResults(result);
    }

    function calculateAndDisplayAlchemyResults() {
        const ing1 = findIngredient(ingredient1Select.value);
        const ing2 = findIngredient(ingredient2Select.value);
        if (!ing1 || !ing2) return;

        alchemyResultsDiv.innerHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafted Potion:</h5>
            <p>Name: ${ing1.Name} & ${ing2.Name} Potion</p>
            <p>Effect: Combines the effects of ${ing1.Effect} and ${ing2.Effect}.</p>
        `;
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
        Object.keys(JEWELRY_VOLUMES).forEach(type => addOption(jewelryTypeSelect, type, type));
        materialsData.filter(m => m.Category === 'Metals').forEach(m => addOption(jewelryMetalSelect, m.Name, m.RowName));
        GEMSTONES.forEach(gem => addOption(jewelryGemstoneSelect, gem.cut, gem.rowName));
    }

    function calculateAndDisplayJewelryResults() {
        if (!jewelryTypeSelect) return;
        const itemType = jewelryTypeSelect.value;
        const metalMaterial = findMaterial(jewelryMetalSelect.value);
        const gemData = GEMSTONES.find(g => g.rowName === jewelryGemstoneSelect.value);

        if (!itemType || !metalMaterial || !gemData) return;

        const volumes = JEWELRY_VOLUMES[itemType];
        const metalDensity = parseFloat(metalMaterial.Density);
        const gemMaterial = findMaterial(gemData.rowName);
        const gemDensity = parseFloat(gemMaterial.Density);

        const requiredMetal = (volumes.Metal * metalDensity) / 100;
        const requiredGem = (volumes.Gemstone * gemDensity) / 100; // This is a bit of a guess, as we don't have separate densities for rough/cut.

        const totalMass = (volumes.Metal * metalDensity + volumes.Gemstone * gemDensity) / 1000;

        jewelryResultsDiv.innerHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Crafting requirements for ${itemType}:</h5>
            <ul class="list-disc list-inside">
                <li>Metal: ${requiredMetal.toFixed(2)} units of ${metalMaterial.Name}</li>
                <li>Gemstone: 1 x ${gemData.cut}</li>
            </ul>
            <h5 class="text-md font-semibold text-emerald-400 mt-2">Item Stats:</h5>
            <p>Estimated Mass: ${totalMass.toFixed(2)} kg</p>
        `;
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

    function createMaterialSelect(id) {
        const select = document.createElement('select');
        select.id = id;
        select.className = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white";
        materialsData.forEach(m => addOption(select, m.Name, m.RowName));
        return select;
    }

    function findMaterial(rowName) { return materialsData.find(m => m.RowName === rowName); }
    function findIngredient(rowName) { return potionIngredientsData.find(i => i.RowName === rowName); }
    function findRune(rowName) { return enchantmentRunesData.find(r => r.RowName === rowName); }

    function getComponentData(container, prefix) {
        const components = {};
        const selects = container.querySelectorAll('select');
        for (const select of selects) {
            const compName = select.id.replace(prefix, '').replace('-', ' ');
            const material = findMaterial(select.value);
            if(!material) return null; // Incomplete selection
            const type = container.id.includes('weapon') ? weaponTypeSelect.value : bowTypeSelect.value;
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
