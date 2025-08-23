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


# In a real scenario, I would load the CSVs I created into pandas DataFrames,
# apply these transformations, and then append the results to the original
# materials.csv.
#
# e.g.
# metals_df = pd.read_csv("metals.csv")
# processed_metals = process_metals(metals_df)
#
# woods_df = pd.read_csv("woods.csv")
# processed_woods = process_woods(woods_df)
#
# ... and so on for minerals and textiles.
#
# final_df = pd.concat([original_df, processed_metals, processed_woods, ...])
# final_df.to_csv("materials.csv", index=False)

print("This script defines the logic for data integration.")
