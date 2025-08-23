import json
import csv

def merge_data():
    """
    Merges 'Magic' and 'Density' data from materials.csv into db.json.
    """
    try:
        with open('public/db.json', 'r') as f:
            db_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error reading db.json: {e}")
        return

    material_properties = {}
    try:
        with open('public/materials.csv', 'r', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                material_properties[row['Name']] = {
                    'Magic': float(row['Magic']),
                    'Density': float(row['Density'])
                }
    except FileNotFoundError as e:
        print(f"Error reading materials.csv: {e}")
        return
    except (KeyError, ValueError) as e:
        print(f"Error processing materials.csv: {e}")
        return

    for category, tiers in db_data.items():
        for tier, materials in tiers.items():
            for material in materials:
                name = material.get('name')
                if name in material_properties:
                    material['magic'] = material_properties[name]['Magic']
                    material['density'] = material_properties[name]['Density']
                else:
                    # Fallback for materials in db.json but not in materials.csv
                    material['magic'] = 0
                    material['density'] = 1.0
                    print(f"Warning: Material '{name}' not found in materials.csv. Using default values for magic and density.")


    try:
        with open('public/db.json', 'w') as f:
            json.dump(db_data, f, indent=2)
        print("Successfully merged data into public/db.json")
    except IOError as e:
        print(f"Error writing to db.json: {e}")

if __name__ == '__main__':
    merge_data()
