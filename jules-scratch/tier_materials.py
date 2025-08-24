import json
import math

def load_json_file(file_path):
    """Loads a JSON file from the given path."""
    with open(file_path, 'r') as f:
        return json.load(f)

def save_json_file(data, file_path):
    """Saves data to a JSON file."""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def tier_materials():
    """
    Loads materials, calculates a power score, and assigns a quintile-based tier
    to each material within its category.
    """
    materials_data = load_json_file('public/materials.json')
    tiered_materials = {}

    print("Tiering materials...")

    for category, tiers in materials_data.items():
        # Flatten all materials in the category into a single list
        all_materials_in_category = []
        for tier_name, material_list in tiers.items():
            all_materials_in_category.extend(material_list)

        # Calculate power score for each material
        for material in all_materials_in_category:
            # Power score is the average of the three physical properties
            power_score = (material.get('slash', 0) +
                           material.get('pierce', 0) +
                           material.get('blunt', 0)) / 3
            material['power_score'] = power_score

        # Sort materials by power score in descending order (best first)
        all_materials_in_category.sort(key=lambda x: x['power_score'], reverse=True)

        # Assign quintile-based tier (1 is best)
        n = len(all_materials_in_category)
        for i, material in enumerate(all_materials_in_category):
            quintile = math.floor(5 * i / n) + 1
            material['tier'] = quintile
            del material['power_score'] # Remove temporary key

        print(f"  - Tiered {len(all_materials_in_category)} materials in '{category}' category.")
        tiered_materials[category] = all_materials_in_category

    # Save the tiered data to a new file
    save_json_file(tiered_materials, 'public/materials_tiered.json')
    print("\nSuccessfully created 'public/materials_tiered.json'")

if __name__ == '__main__':
    tier_materials()
