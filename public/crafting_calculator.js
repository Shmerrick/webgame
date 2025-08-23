document.addEventListener('DOMContentLoaded', () => {
    const armorPieceSelect = document.getElementById('armor-piece');
    const outerMaterialSelect = document.getElementById('outer-material');
    const innerMaterialSelect = document.getElementById('inner-material');
    const bindingMaterialSelect = document.getElementById('binding-material');
    const resultsDiv = document.getElementById('crafting-results');

    let materialsData = [];
    let armorVolumesData = {};

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

            populateDropdowns();
            setupEventListeners();
            calculateAndDisplayResults();
        } catch (error) {
            console.error("Failed to load crafting data:", error);
            resultsDiv.innerHTML = `<p class="text-red-400">Error loading crafting data. Please try again later.</p>`;
        }
    }

    function populateDropdowns() {
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

    function setupEventListeners() {
        [armorPieceSelect, outerMaterialSelect, innerMaterialSelect, bindingMaterialSelect].forEach(select => {
            select.addEventListener('change', calculateAndDisplayResults);
        });
    }

    function calculateAndDisplayResults() {
        const selectedPiece = armorPieceSelect.value;
        const outerMaterial = materialsData.find(m => m.RowName === outerMaterialSelect.value);
        const innerMaterial = materialsData.find(m => m.RowName === innerMaterialSelect.value);
        const bindingMaterial = materialsData.find(m => m.RowName === bindingMaterialSelect.value);

        if (!selectedPiece || !outerMaterial || !innerMaterial || !bindingMaterial) {
            resultsDiv.innerHTML = '<p>Please select all options.</p>';
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

        resultsDiv.innerHTML = `
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

    loadData();
});
