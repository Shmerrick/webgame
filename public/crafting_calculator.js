document.addEventListener('DOMContentLoaded', () => {
    // Common
    let materialsData = [];

    // Armor
    const armorPieceSelect = document.getElementById('armor-piece');
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

            populateAllDropdowns();
            setupAllEventListeners();
            calculateAllResults();

        } catch (error) {
            console.error("Failed to load crafting data:", error);
            const allResultsDivs = [armorResultsDiv, shieldResultsDiv, weaponResultsDiv, bowResultsDiv, alchemyResultsDiv, enchantingResultsDiv];
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
    }

    function setupAllEventListeners() {
        [armorPieceSelect, outerMaterialSelect, innerMaterialSelect, bindingMaterialSelect].forEach(el => el.addEventListener('change', calculateAndDisplayArmorResults));
        [shieldTypeSelect, shieldBodyMaterialSelect, shieldBossMaterialSelect, shieldRimMaterialSelect].forEach(el => el.addEventListener('change', calculateAndDisplayShieldResults));
        weaponTypeSelect.addEventListener('change', () => {
            populateWeaponComponents();
            calculateAndDisplayWeaponResults();
        });
        bowTypeSelect.addEventListener('change', () => {
            populateBowComponents();
            calculateAndDisplayBowResults();
        });
        [ingredient1Select, ingredient2Select].forEach(el => el.addEventListener('change', calculateAndDisplayAlchemyResults));
        [rune1Select, rune2Select].forEach(el => el.addEventListener('change', calculateAndDisplayEnchantingResults));
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

    function populateBowyerDropdowns() {
        const bowTypes = ["Bow", "Crossbow", "Sling"];
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
        const type = bowTypeSelect.value;
        bowComponentsDiv.innerHTML = '';
        if (!type || !weaponVolumesData[type]) return;

        Object.keys(weaponVolumesData[type]).forEach(comp => {
            const id = `bow-comp-${comp.toLowerCase().replace(' ', '-')}`;
            const label = createLabel(comp, id);
            const select = createMaterialSelect(id);
            select.addEventListener('change', calculateAndDisplayBowResults);
            bowComponentsDiv.appendChild(label);
            bowComponentsDiv.appendChild(select);
        });
    }

    // --- Calculation Functions ---
    function calculateAndDisplayArmorResults() {
        const piece = armorPieceSelect.value;
        const outerMat = findMaterial(outerMaterialSelect.value);
        const innerMat = findMaterial(innerMaterialSelect.value);
        const bindingMat = findMaterial(bindingMaterialSelect.value);

        if (!piece || !outerMat || !innerMat || !bindingMat) return;

        const volumes = armorVolumesData[piece];
        const result = calculatePhysicalItemStats({
            Outer: { material: outerMat, volume: volumes.Outer },
            Inner: { material: innerMat, volume: volumes.Inner },
            Binding: { material: bindingMat, volume: volumes.Binding }
        });
        armorResultsDiv.innerHTML = formatResults(result);
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

    function calculateAndDisplayWeaponResults() {
        const type = weaponTypeSelect.value;
        if (!type || !weaponVolumesData[type]) return;

        const components = getComponentData(weaponComponentsDiv, 'weapon-comp-');
        if(!components) return;

        const result = calculatePhysicalItemStats(components);
        weaponResultsDiv.innerHTML = formatResults(result);
    }

    function calculateAndDisplayBowResults() {
        const type = bowTypeSelect.value;
        if (!type || !weaponVolumesData[type]) return;

        const components = getComponentData(bowComponentsDiv, 'bow-comp-');
        if(!components) return;

        const result = calculatePhysicalItemStats(components);
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
