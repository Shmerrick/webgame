document.addEventListener('DOMContentLoaded', () => {
    const armorPieceSelect = document.getElementById('armor-piece');
    const outerMaterialSelect = document.getElementById('outer-material');
    const innerMaterialSelect = document.getElementById('inner-material');
    const bindingMaterialSelect = document.getElementById('binding-material');
    const armorResultsDiv = document.getElementById('crafting-results');

    const shieldTypeSelect = document.getElementById('shield-type');
    const shieldBodyMaterialSelect = document.getElementById('shield-body-material');
    const shieldBossMaterialSelect = document.getElementById('shield-boss-material');
    const shieldRimMaterialSelect = document.getElementById('shield-rim-material');
    const shieldResultsDiv = document.getElementById('shield-crafting-results');

    let materialsData = [];
    let armorVolumesData = {};
    let shieldVolumesData = {};

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
            const materialsResponse = await fetch('../materials.csv');
            const materialsCsv = await materialsResponse.text();
            materialsData = parseCSV(materialsCsv);

            // Fetch armor volumes
            const armorVolumesResponse = await fetch('../armor_volumes.csv');
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
            const shieldVolumesResponse = await fetch('../shield_volumes.csv');
            const shieldVolumesCsv = await shieldVolumesResponse.text();
            const parsedShieldVolumes = parseCSV(shieldVolumesCsv);

            // Restructure shield volumes for easy lookup
            parsedShieldVolumes.forEach(item => {
                if (!shieldVolumesData[item.ShieldType]) {
                    shieldVolumesData[item.ShieldType] = {};
                }
                shieldVolumesData[item.ShieldType][item.Component] = parseFloat(item.Volume_cm3);
            });

            populateArmorDropdowns();
            populateShieldDropdowns();
            setupEventListeners();
            calculateAndDisplayArmorResults();
            calculateAndDisplayShieldResults();
        } catch (error) {
            console.error("Failed to load crafting data:", error);
            armorResultsDiv.innerHTML = `<p class="text-red-400">Error loading crafting data. Please try again later.</p>`;
            shieldResultsDiv.innerHTML = `<p class="text-red-400">Error loading crafting data. Please try again later.</p>`;
        }
    }

    function populateArmorDropdowns() {
        // Populate armor pieces
        Object.keys(armorVolumesData).forEach(piece => {
            const option = document.createElement('option');
            option.value = piece;
            option.textContent = piece;
            armorPieceSelect.appendChild(option);
        });

        // Populate material selects
        materialsData.forEach(material => {
            const option = document.createElement('option');
            option.value = material.RowName;
            option.textContent = material.Name;

            outerMaterialSelect.appendChild(option.cloneNode(true));
            innerMaterialSelect.appendChild(option.cloneNode(true));
            bindingMaterialSelect.appendChild(option.cloneNode(true));
        });
    }

    function populateShieldDropdowns() {
        // Populate shield types
        Object.keys(shieldVolumesData).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            shieldTypeSelect.appendChild(option);
        });

        // Populate material selects
        materialsData.forEach(material => {
            const option = document.createElement('option');
            option.value = material.RowName;
            option.textContent = material.Name;

            shieldBodyMaterialSelect.appendChild(option.cloneNode(true));
            shieldBossMaterialSelect.appendChild(option.cloneNode(true));
            shieldRimMaterialSelect.appendChild(option.cloneNode(true));
        });
    }

    function setupEventListeners() {
        [armorPieceSelect, outerMaterialSelect, innerMaterialSelect, bindingMaterialSelect].forEach(select => {
            select.addEventListener('change', calculateAndDisplayArmorResults);
        });

        [shieldTypeSelect, shieldBodyMaterialSelect, shieldBossMaterialSelect, shieldRimMaterialSelect].forEach(select => {
            select.addEventListener('change', calculateAndDisplayShieldResults);
        });
    }

    function calculateAndDisplayArmorResults() {
        const selectedPiece = armorPieceSelect.value;
        const outerMaterial = materialsData.find(m => m.RowName === outerMaterialSelect.value);
        const innerMaterial = materialsData.find(m => m.RowName === innerMaterialSelect.value);
        const bindingMaterial = materialsData.find(m => m.RowName === bindingMaterialSelect.value);

        if (!selectedPiece || !outerMaterial || !innerMaterial || !bindingMaterial) {
            armorResultsDiv.innerHTML = '<p>Please select all options.</p>';
            return;
        }

        const volumes = armorVolumesData[selectedPiece];
        const outerDensity = parseFloat(outerMaterial.Density);
        const innerDensity = parseFloat(innerMaterial.Density);
        const bindingDensity = parseFloat(bindingMaterial.Density);

        // Calculate required units (volume * density / 100)
        const requiredOuter = (volumes.Outer * outerDensity) / 100;
        const requiredInner = (volumes.Inner * innerDensity) / 100;
        const requiredBinding = (volumes.Binding * bindingDensity) / 100;

        // Calculate total mass in kg
        const totalMass = ((volumes.Outer * outerDensity) + (volumes.Inner * innerDensity) + (volumes.Binding * bindingDensity)) / 1000;

        armorResultsDiv.innerHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Required Materials:</h5>
            <ul class="list-disc list-inside">
                <li>Outer Layer: ${requiredOuter.toFixed(2)} units of ${outerMaterial.Name}</li>
                <li>Inner Layer: ${requiredInner.toFixed(2)} units of ${innerMaterial.Name}</li>
                <li>Binding: ${requiredBinding.toFixed(2)} units of ${bindingMaterial.Name}</li>
            </ul>
            <h5 class="text-md font-semibold text-emerald-400 mt-2">Item Stats:</h5>
            <p>Estimated Mass: ${totalMass.toFixed(2)} kg</p>
        `;
    }

    function calculateAndDisplayShieldResults() {
        const selectedType = shieldTypeSelect.value;
        const bodyMaterial = materialsData.find(m => m.RowName === shieldBodyMaterialSelect.value);
        const bossMaterial = materialsData.find(m => m.RowName === shieldBossMaterialSelect.value);
        const rimMaterial = materialsData.find(m => m.RowName === shieldRimMaterialSelect.value);

        if (!selectedType || !bodyMaterial || !bossMaterial || !rimMaterial) {
            shieldResultsDiv.innerHTML = '<p>Please select all options.</p>';
            return;
        }

        const volumes = shieldVolumesData[selectedType];
        const bodyDensity = parseFloat(bodyMaterial.Density);
        const bossDensity = parseFloat(bossMaterial.Density);
        const rimDensity = parseFloat(rimMaterial.Density);

        const requiredBody = (volumes.Body * bodyDensity) / 100;
        const requiredBoss = (volumes.Boss * bossDensity) / 100;
        const requiredRim = (volumes.Rim * rimDensity) / 100;

        const totalMass = ((volumes.Body * bodyDensity) + (volumes.Boss * bossDensity) + (volumes.Rim * rimDensity)) / 1000;

        shieldResultsDiv.innerHTML = `
            <h5 class="text-md font-semibold text-emerald-400 mt-4">Required Materials:</h5>
            <ul class="list-disc list-inside">
                <li>Body: ${requiredBody.toFixed(2)} units of ${bodyMaterial.Name}</li>
                <li>Boss: ${requiredBoss.toFixed(2)} units of ${bossMaterial.Name}</li>
                <li>Rim: ${requiredRim.toFixed(2)} units of ${rimMaterial.Name}</li>
            </ul>
            <h5 class="text-md font-semibold text-emerald-400 mt-2">Item Stats:</h5>
            <p>Estimated Mass: ${totalMass.toFixed(2)} kg</p>
        `;
    }

    loadData();
});
