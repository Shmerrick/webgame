from playwright.sync_api import Page, expect

def test_siege_crafting(page: Page):
    page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
    page.goto("http://localhost:3000/siege.html")

    siege_weapon_type_select = page.locator("#siege-weapon-type")

    # Wait for the dropdown to be populated
    expect(siege_weapon_type_select.locator("option[value='Catapult']")).to_be_enabled(timeout=10000)

    siege_weapon_type_select.select_option("Catapult")

    # Wait for the components to be populated
    frame_material_select = page.locator("#siege-comp-frame")
    arm_material_select = page.locator("#siege-comp-arm")
    bucket_material_select = page.locator("#siege-comp-bucket")
    rope_material_select = page.locator("#siege-comp-rope")

    expect(frame_material_select).to_be_visible(timeout=10000)

    frame_material_select.select_option("Wood_T2_Oak_Ash_Maple")
    arm_material_select.select_option("Wood_T3_Hickory_Ebony_Ironwood")
    bucket_material_select.select_option("Metals_T2_Wrought_Iron")
    rope_material_select.select_option("Cloth_T2_Hemp")

    expect(page.locator("#siege-crafting-results")).to_contain_text("Required Materials", timeout=5000)
    expect(page.locator("#siege-crafting-results")).to_contain_text("Estimated Mass", timeout=5000)

    page.screenshot(path="siege_crafting_verification.png")
