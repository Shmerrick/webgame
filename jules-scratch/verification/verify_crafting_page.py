import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    Navigates to the crafting page and takes a screenshot to verify it loads correctly.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the local web server
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.goto("http://localhost:8000/crafting.html")

        # Wait for a key element to be populated, indicating the script has run
        # Let's wait for the "Outer Material" dropdown to have options
        outer_material_select = page.locator("#outer-material")

        # We expect the dropdown to eventually contain exactly one option for "Copper"
        # This confirms that materials.json was fetched and processed.
        expect(outer_material_select.locator("option[value*='Metals_T1_Copper']")).to_have_count(1, timeout=10000)

        # Take a screenshot of the crafting page
        screenshot_path = "jules-scratch/verification/crafting_page.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_verification()
