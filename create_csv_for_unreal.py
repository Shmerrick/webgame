import json
import csv
import re

def create_csv():
    """
    Reads the db.json file, processes the data, and writes it to a materials.csv file
    formatted for Unreal Engine Data Table import.
    """
    try:
        with open('public/db.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: public/db.json not found.")
        return
    except json.JSONDecodeError:
        print("Error: Could not decode JSON from public/db.json.")
        return

    header = ['RowName', 'Category', 'Tier', 'Name', 'Slash', 'Pierce', 'Blunt', 'Magic']

    # Use a set to ensure RowNames are unique
    row_names = set()

    rows = []
    for category, tiers in data.items():
        for tier, materials in tiers.items():
            for material in materials:
                # Sanitize the material name to create a valid RowName
                # Remove content in parentheses, strip whitespace, replace other chars
                clean_name = re.sub(r'\(.*\)', '', material['name']).strip()
                clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', clean_name)

                row_name = f"{category}_{tier}_{clean_name}"

                # Handle potential duplicate RowNames
                counter = 1
                original_row_name = row_name
                while row_name in row_names:
                    row_name = f"{original_row_name}_{counter}"
                    counter += 1
                row_names.add(row_name)

                rows.append([
                    row_name,
                    category,
                    tier,
                    material['name'],
                    material.get('slash', 0),
                    material.get('pierce', 0),
                    material.get('blunt', 0),
                    material.get('magic', 0)
                ])

    try:
        with open('materials.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(rows)
        print("Successfully created materials.csv")
    except IOError:
        print("Error: Could not write to materials.csv.")

if __name__ == '__main__':
    create_csv()
