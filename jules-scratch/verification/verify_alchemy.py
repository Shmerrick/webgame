from playwright.sync_api import Page, expect

def test_alchemy_crafting(page: Page):
    """
    This test verifies that a user can craft a Health Potion
    by selecting the correct ingredients.
    """
    # Listen for console messages
    page.on("console", lambda msg: print(f"CONSOLE: type={msg.type}, text={msg.text}, location={msg.location}"))

    # 1. Arrange: Go to the crafting page.
    page.goto("http://localhost:3000/crafting.html")

    # 2. Act: Select the ingredients for a Health Potion.
    page.wait_for_selector("#ingredient1")
    ingredient1_select = page.locator("#ingredient1")
    ingredient2_select = page.locator("#ingredient2")

    ingredient1_select.select_option("Crimson_Petal")
    ingredient2_select.select_option("Blessed_Water")

    # 3. Assert: Confirm the results are displayed correctly.
    results_div = page.locator("#alchemy-results")
    expect(results_div).to_contain_text("Health Potion")
    expect(results_div).to_contain_text("Restores 50 health.")
    expect(results_div).to_contain_text("Health: 50")

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/alchemy-verification.png")
