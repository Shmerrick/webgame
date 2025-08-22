document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('name');
    const classSelect = document.getElementById('class');
    const armorSelect = document.getElementById('armor');
    const weaponSelect = document.getElementById('weapon');

    const summaryName = document.getElementById('summary-name');
    const summaryClass = document.getElementById('summary-class');
    const summaryArmor = document.getElementById('summary-armor');
    const summaryWeapon = document.getElementById('summary-weapon');

    function updateSummary() {
        summaryName.textContent = nameInput.value;
        summaryClass.textContent = classSelect.options[classSelect.selectedIndex].text;
        summaryArmor.textContent = armorSelect.options[armorSelect.selectedIndex].text;
        summaryWeapon.textContent = weaponSelect.options[weaponSelect.selectedIndex].text;
    }

    nameInput.addEventListener('input', updateSummary);
    classSelect.addEventListener('change', updateSummary);
    armorSelect.addEventListener('change', updateSummary);
    weaponSelect.addEventListener('change', updateSummary);

    // Initial summary update
    updateSummary();
});
