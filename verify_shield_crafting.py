from playwright.sync_api import Page, expect

def test_shield_crafting(page: Page):
    page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
    page.goto("http://localhost:3000/crafting.html")

    shield_type_select = page.locator("#shield-type")
    shield_body_material_select = page.locator("#shield-body-material")
    shield_boss_material_select = page.locator("#shield-boss-material")
    shield_rim_material_select = page.locator("#shield-rim-material")

    shield_type_select.select_option("Kite Shield")
    shield_body_material_select.select_option("Carbon Steel")
    shield_boss_material_select.select_option("Iron")
    shield_rim_material_select.select_option("Bronze (Cu+Sn)")

    expect(page.locator("#shield-crafting-results")).to_contain_text("Required Materials")

    page.screenshot(path="shield_crafting_verification.png")
