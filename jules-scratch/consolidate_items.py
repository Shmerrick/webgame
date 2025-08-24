import json
import itertools
import math

def load_json_file(file_path):
    """Loads a JSON file from the given path."""
    with open(file_path, 'r') as f:
        return json.load(f)

def save_json_file(data, file_path):
    """Saves data to a JSON file."""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

# --- Tiering Materials ---
def tier_materials():
    materials_data = load_json_file('public/materials.json')
    tiered_materials_by_cat = {}

    for category, tiers in materials_data.items():
        all_materials_in_category = [mat for tier_list in tiers.values() for mat in tier_list]

        for material in all_materials_in_category:
            material['Category'] = category # Add category info to material object
            power_score = (material.get('slash', 0) + material.get('pierce', 0) + material.get('blunt', 0)) / 3
            material['power_score'] = power_score

        all_materials_in_category.sort(key=lambda x: x['power_score'], reverse=True)

        n = len(all_materials_in_category)
        for i, material in enumerate(all_materials_in_category):
            quintile = math.floor(5 * i / n) + 1
            material['material_tier'] = quintile
            del material['power_score']

        tiered_materials_by_cat[category] = all_materials_in_category

    flat_tiered_materials = {mat['rowName']: mat for cat_list in tiered_materials_by_cat.values() for mat in cat_list}
    return flat_tiered_materials


# --- Item Generation ---
def process_armor(materials, volumes_data):
    items = []
    volumes_map = {}
    for item in volumes_data:
        piece = item['ArmorPiece']
        if piece not in volumes_map:
            volumes_map[piece] = {}
        volumes_map[piece][item['Component']] = float(item['Volume_cm3'])

    inner_mat = materials['Leather_T2_Cowhide_Pigskin']
    binding_mat = materials['Leather_T1_Deerskin']

    for piece, volumes in volumes_map.items():
        for mat_row, outer_mat in materials.items():
            if outer_mat['Category'] not in ["Metals", "Wood", "Leather", "Scales"]: continue
            for class_name, mod in {"Light": 0.45, "Medium": 0.65, "Heavy": 0.85}.items():
                w = (0.80, 0.15, 0.05)
                defenses = {
                    "slash": mod * (outer_mat['slash'] * w[0] + inner_mat['slash'] * w[1] + binding_mat['slash'] * w[2]),
                    "pierce": mod * (outer_mat['pierce'] * w[0] + inner_mat['pierce'] * w[1] + binding_mat['pierce'] * w[2]),
                    "blunt": mod * (outer_mat['blunt'] * w[0] + inner_mat['blunt'] * w[1] + binding_mat['blunt'] * w[2])
                }
                item_id = f"armor_{piece.lower().replace(' ', '_')}_{class_name.lower()}_{outer_mat['name'].lower().replace(' ', '_')}"
                items.append({
                    "id": item_id, "name": f"{class_name} {outer_mat['name']} {piece}", "item_type": "Armor", "type": piece,
                    "defense": {k: round(v * 100, 1) for k, v in defenses.items()},
                    "material_tier": outer_mat['material_tier'], "material_category": outer_mat['Category'],
                    "icon": f"icons/armor/{piece.lower()}.png", "texture": f"textures/armor/{item_id}.png"
                })
    return items

def process_weapons(materials, volumes_data):
    items = []
    volumes_map = {}
    for item in volumes_data:
        weapon_type = item['weapon_type']
        if weapon_type not in volumes_map:
            volumes_map[weapon_type] = {}
        volumes_map[weapon_type][item['component_name']] = float(item['volume_cm3'])

    handle_mat = materials['Wood_T2_Oak_Ash_Maple']

    for type, volumes in volumes_map.items():
        if type not in ["Sword", "Axe", "Hammer", "Dagger"]: continue
        primary_comp = "Blade" if "Blade" in volumes else "Head"
        for mat_row, primary_mat in materials.items():
            if primary_mat['Category'] != "Metals": continue
            offense = {"slash": primary_mat['slash'], "pierce": primary_mat['pierce'], "blunt": primary_mat['blunt']}
            item_id = f"weapon_{type.lower()}_{primary_mat['name'].lower().replace(' ', '_')}"
            items.append({
                "id": item_id, "name": f"{primary_mat['name']} {type}", "item_type": "Weapon", "type": type,
                "offense": {k: round(v * 100, 1) for k, v in offense.items()},
                "material_tier": primary_mat['material_tier'], "material_category": primary_mat['Category'],
                "icon": f"icons/weapons/{type.lower()}.png", "texture": f"textures/weapons/{item_id}.png"
            })
    return items

def assign_item_quality_tiers(items):
    items_by_type = {}
    for item in items:
        key = item.get('type')
        if not key: continue
        items_by_type.setdefault(key, []).append(item)

    for item_type, sub_items in items_by_type.items():
        if not sub_items: continue

        for item in sub_items:
            stats = item.get('defense', item.get('offense', {}))
            item['power'] = sum(stats.values())

        sub_items.sort(key=lambda x: x['power'], reverse=True)

        n = len(sub_items)
        for i, item in enumerate(sub_items):
            quintile = math.floor(5 * i / n) + 1
            item['quality_tier'] = quintile
            del item['power']

def main():
    print("1. Tiering materials...")
    tiered_materials = tier_materials()
    save_json_file(tiered_materials, 'public/materials_tiered.json')
    print("   ...materials tiered and saved.")

    print("\n2. Generating item database...")
    armor_volumes = load_json_file('public/armor_volumes.json')
    weapon_volumes = load_json_file('public/weapon_volumes.json')

    all_items = []
    all_items.extend(process_armor(tiered_materials, armor_volumes))
    all_items.extend(process_weapons(tiered_materials, weapon_volumes))
    print("   ...item generation complete.")

    print("\n3. Assigning item quality tiers...")
    assign_item_quality_tiers(all_items)
    print("   ...quality tiers assigned.")

    print("\n4. Building final database structure...")
    final_db = {}
    for item in all_items:
        category = item.pop('material_category')
        if category not in final_db:
            final_db[category] = []
        final_db[category].append(item)
    print("   ...database structure built.")

    save_json_file(final_db, 'cpp/item_database.json')
    print("\nSuccessfully created cpp/item_database.json")

if __name__ == '__main__':
    main()
