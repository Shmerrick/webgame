import pandas as pd

# This script is a conceptual representation of the logic I will use to integrate
# the new materials data into the game's `materials.csv` file.
# I will not be able to run this script in this environment, but it serves to
# document the complex data transformation process.

def calculate_tier(score):
    if score > 0.8:
        return "T5"
    elif score > 0.6:
        return "T4"
    elif score > 0.4:
        return "T3"
    elif score > 0.2:
        return "T2"
    else:
        return "T1"

def process_metals(metals_df):
    # Normalize real-world properties to a 0-1 scale
    density_norm = (metals_df['Density (g/cm^3)'] - metals_df['Density (g/cm^3)'].min()) / (metals_df['Density (g/cm^3)'].max() - metals_df['Density (g/cm^3)'].min())
    strength_norm = (metals_df['Tensile Strength (MPa)'] - metals_df['Tensile Strength (MPa)'].min()) / (metals_df['Tensile Strength (MPa)'].max() - metals_df['Tensile Strength (MPa)'].min())
    hardness_norm = (metals_df['Hardness (MPa)'] - metals_df['Hardness (MPa)'].min()) / (metals_df['Hardness (MPa)'].max() - metals_df['Hardness (MPa)'].min())

    # Formulas to map real-world properties to game properties
    # These are my best assumptions based on the existing data.
    metals_df['Slash'] = (strength_norm * 0.6 + hardness_norm * 0.4).clip(0, 1)
    metals_df['Pierce'] = (strength_norm * 0.4 + hardness_norm * 0.6).clip(0, 1)
    metals_df['Blunt'] = (density_norm * 0.5 + strength_norm * 0.5).clip(0, 1)
    metals_df['Magic'] = (1 - (density_norm + strength_norm + hardness_norm) / 3).clip(0, 1) * 0.5 # Magic is inverse to physical properties

    # Calculate a composite score for tiering
    composite_score = (density_norm + strength_norm + hardness_norm) / 3
    metals_df['Tier'] = composite_score.apply(calculate_tier)

    metals_df['Category'] = 'Metals'
    metals_df['RowName'] = metals_df.apply(lambda row: f"Metals_{row['Tier']}_{row['Material'].replace(' ', '_')}", axis=1)
    metals_df['Name'] = metals_df['Material']

    return metals_df[['RowName', 'Category', 'Tier', 'Name', 'Slash', 'Pierce', 'Blunt', 'Magic']]

def process_woods(woods_df):
    # Similar processing for woods...
    density_norm = (woods_df['Density (g/cm^3)'] - woods_df['Density (g/cm^3)'].min()) / (woods_df['Density (g/cm^3)'].max() - woods_df['Density (g/cm^3)'].min())
    hardness_norm = (woods_df['Janka Hardness (N)'] - woods_df['Janka Hardness (N)'].min()) / (woods_df['Janka Hardness (N)'].max() - woods_df['Janka Hardness (N)'].min())
    strength_norm = (woods_df['Modulus of Rupture (MPa)'] - woods_df['Modulus of Rupture (MPa)'].min()) / (woods_df['Modulus of Rupture (MPa)'].max() - woods_df['Modulus of Rupture (MPa)'].min())

    woods_df['Slash'] = (strength_norm * 0.7 + hardness_norm * 0.3).clip(0, 1)
    woods_df['Pierce'] = (hardness_norm * 0.7 + strength_norm * 0.3).clip(0, 1)
    woods_df['Blunt'] = (density_norm * 0.8 + strength_norm * 0.2).clip(0, 1)
    woods_df['Magic'] = (1 - density_norm).clip(0, 1) * 0.8 # Wood is more magical

    composite_score = (density_norm + strength_norm + hardness_norm) / 3
    woods_df['Tier'] = composite_score.apply(calculate_tier)

    woods_df['Category'] = 'Wood'
    woods_df['RowName'] = woods_df.apply(lambda row: f"Wood_{row['Tier']}_{row['Name'].replace(' ', '_')}", axis=1)

    return woods_df[['RowName', 'Category', 'Tier', 'Name', 'Slash', 'Pierce', 'Blunt', 'Magic']]


def integrate_density(materials_df, real_world_df):
    """
    Merges real-world density data into the materials dataframe and estimates
    densities for materials without real-world counterparts.
    """
    # Clean up names for merging, e.g., "Bronze (Cu+Sn)" becomes "Bronze"
    materials_df['MergeName'] = materials_df['Name'].str.split(' \(').str[0]
    real_world_df['MergeName'] = real_world_df['Material'].str.split(' \(').str[0]

    # Perform a left merge to add density data to the materials
    merged_df = pd.merge(
        materials_df,
        real_world_df[['MergeName', 'Density (g/cm^3)']],
        on='MergeName',
        how='left'
    )

    merged_df.rename(columns={'Density (g/cm^3)': 'Density'}, inplace=True)
    merged_df.drop(columns=['MergeName'], inplace=True)

    # Estimate densities for fantasy materials where real-world data is not available
    fantasy_densities = {
        'Mithril': 4.0,       # Lighter than steel, akin to Titanium
        'Adamantite': 10.0,   # Very dense and strong
        'Orichalcum': 8.0,    # Magical, dense like bronze
        'Dragonhide': 1.5,    # Tough but relatively light
        'Dragon Scales': 2.5, # Heavier than normal scales
    }
    merged_df['Density'] = merged_df.apply(
        lambda row: fantasy_densities.get(row['Name'], row['Density']),
        axis=1
    )

    # For any other missing values, fill with the mean of their category and tier
    merged_df['Density'] = merged_df.groupby(['Category', 'Tier'])['Density'].transform(
        lambda x: x.fillna(x.mean())
    )
    # Fill any remaining NaNs with the global mean density
    merged_df['Density'].fillna(merged_df['Density'].mean(), inplace=True)

    return merged_df


# In a real scenario, this is how the script would be used:
#
# 1. Load the existing material data and the real-world properties.
#    materials_df = pd.read_csv("materials.csv")
#    real_world_df = pd.read_csv("real_world_properties.csv")
#
# 2. Integrate the density information.
#    updated_materials_df = integrate_density(materials_df, real_world_df)
#
# 3. Save the updated dataframe, now including the 'Density' column,
#    back to materials.csv.
#    updated_materials_df.to_csv("materials.csv", index=False)

print("This script defines the logic for data integration, including density.")
