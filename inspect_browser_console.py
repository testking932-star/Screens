import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Register simple event handlers
        page.on("console", lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
            
        print("Navigating to http://localhost:8085/?page=screen1 ...")
        await page.goto("http://localhost:8085/?page=screen1")
        
        # Wait 10 seconds to let multiple sync cycles run
        await page.wait_for_timeout(10000)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
