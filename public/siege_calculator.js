document.addEventListener('DOMContentLoaded', () => {
    let materialsData = [];
    let siegeVolumesData = {};

    const siegeWeaponTypeSelect = document.getElementById('siege-weapon-type');
    const siegeWeaponComponentsDiv = document.getElementById('siege-weapon-components');
    const siegeResultsDiv = document.getElementById('siege-crafting-results');

    // Fetch and process data
    async function loadData() {
        try {
            // Fetch all data from new JSON files
            const [
                materialsJson,
                siegeVolumesList,
            ] = await Promise.all([
                fetch('/materials.json').then(res => res.json()),
                fetch('/siege_volumes.json').then(res => res.json()),
            ]);

            // Process materials into a flat list
            materialsData = processMaterials(materialsJson);

            // Restructure siege volumes for easy lookup
            siegeVolumesList.forEach(item => {
                if (!siegeVolumesData[item.siege_weapon_type]) {
                    siegeVolumesData[item.siege_weapon_type] = {};
                }
                siegeVolumesData[item.siege_weapon_type][item.component_name] = parseFloat(item.volume_cm3);
            });

            populateDropdowns();
            setupEventListeners();
            calculateResults();

        } catch (error) {
            console.error("Failed to load siege crafting data:", error);
            if(siegeResultsDiv) siegeResultsDiv.innerHTML = `<p class="text-red-400">Error loading crafting data. Please try again later.</p>`;
        }
    }

    function populateDropdowns() {
        Object.keys(siegeVolumesData).forEach(type => addOption(siegeWeaponTypeSelect, type, type));
    }

    function setupEventListeners() {
        siegeWeaponTypeSelect.addEventListener('change', () => {
            populateSiegeWeaponComponents();
            calculateResults();
        });
    }

    function calculateResults() {
        populateSiegeWeaponComponents(); // Initial population
        calculateAndDisplaySiegeResults();
    }

    function populateSiegeWeaponComponents() {
        const type = siegeWeaponTypeSelect.value;
        siegeWeaponComponentsDiv.innerHTML = '';
        if (!type || !siegeVolumesData[type]) return;

        Object.keys(siegeVolumesData[type]).forEach(comp => {
            const id = `siege-comp-${comp.toLowerCase().replace(/ /g, '-')}`;
            const label = createLabel(comp, id);
            const select = createMaterialSelect(id);
            select.addEventListener('change', calculateAndDisplaySiegeResults);

            const container = document.createElement('div');
            container.appendChild(label);
            container.appendChild(select);
            siegeWeaponComponentsDiv.appendChild(container);
        });
    }

    function processMaterials(data) {
        const materials = [];
        for (const category in data) {
            for (const tier in data[category]) {
                for (const material of data[category][tier]) {
                    materials.push({
                        RowName: material.rowName, // Use the pre-existing rowName from JSON
                        Category: category,
                        Tier: tier,
                        Name: material.name,
                        Slash: material.slash,
                        Pierce: material.pierce,
                        Blunt: material.blunt,
                        Magic: material.magic,
                        Density: material.density
                    });
                }
            }
        }
        return materials;
    }

    function calculateAndDisplaySiegeResults() {
        const type = siegeWeaponTypeSelect.value;
        if (!type || !siegeVolumesData[type]) return;

        const components = getComponentData(siegeWeaponComponentsDiv, 'siege-comp-');
        if(!components) return;

        const result = calculatePhysicalItemStats(components);
        siegeResultsDiv.innerHTML = formatResults(result);
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
        label.textContent = text.charAt(0).toUpperCase() + text.slice(1);
        return label;
    }

    function createMaterialSelect(id) {
        const select = document.createElement('select');
        select.id = id;
        select.name = id;
        select.className = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-slate-700 text-white";
        materialsData.forEach(m => addOption(select, m.Name, m.RowName));
        return select;
    }

    function findMaterial(rowName) { return materialsData.find(m => m.RowName === rowName); }

    function getComponentData(container, prefix) {
        const components = {};
        const selects = container.querySelectorAll('select');
        for (const select of selects) {
            const compName = select.id.replace(prefix, '').replace(/-/g, ' ');
            const material = findMaterial(select.value);
            if(!material) return null; // Incomplete selection

            const type = siegeWeaponTypeSelect.value;
            const volume = siegeVolumesData[type][
                Object.keys(siegeVolumesData[type]).find(k => k.toLowerCase() === compName)
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
