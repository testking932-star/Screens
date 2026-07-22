import os
import re
import sys

def run_tests():
    print("==================================================")
    print("       CLOVER MENU APP INTEGRITY TEST SUITE       ")
    print("==================================================")
    
    errors = 0
    warnings = 0
    
    # 1. Check core files exist
    files_to_check = ['index.html', 'style.css', 'app.js']
    for file in files_to_check:
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"[✓] Found {file} ({size} bytes)")
        else:
            print(f"[✕] ERROR: {file} is missing!")
            errors += 1

    # 2. Check asset folder and images exist
    assets_to_check = [
        'assets/burger.png',
        'assets/pizza.png',
        'assets/drink.png',
        'assets/dessert.png'
    ]
    
    if os.path.exists('assets'):
        print("[✓] Found assets directory")
        for asset in assets_to_check:
            if os.path.exists(asset):
                size = os.path.getsize(asset)
                print(f"  [✓] Found {asset} ({size} bytes)")
            else:
                print(f"  [✕] ERROR: Asset {asset} is missing!")
                errors += 1
    else:
        print("[✕] ERROR: assets directory is missing!")
        errors += 1

    # 3. Analyze index.html links and references
    if os.path.exists('index.html'):
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Verify style.css is linked
        if 'style.css' in html_content:
            print("[✓] index.html correctly references style.css")
        else:
            print("[✕] ERROR: index.html is missing stylesheet link to style.css!")
            errors += 1
            
        # Verify app.js is linked
        if 'app.js' in html_content:
            print("[✓] index.html correctly references app.js")
        else:
            print("[✕] ERROR: index.html is missing script source app.js!")
            errors += 1
            
        # Check matching ids for TV and Admin views
        required_ids = ['view-tv', 'view-admin', 'settings-modal', 'tv-menu-grid', 'admin-inventory-list']
        for req_id in required_ids:
            if f'id="{req_id}"' in html_content or f"id='{req_id}'" in html_content:
                print(f"  [✓] HTML contains required element ID: '{req_id}'")
            else:
                print(f"  [✕] WARNING: ID '{req_id}' not found in HTML!")
                warnings += 1

    # 4. Check app.js structures and local fallback references
    if os.path.exists('app.js'):
        with open('app.js', 'r', encoding='utf-8') as f:
            js_content = f.read()
            
        # Verify DEMO_INVENTORY references
        expected_refs = ['assets/burger.png', 'assets/pizza.png', 'assets/drink.png', 'assets/dessert.png']
        for ref in expected_refs:
            if ref in js_content:
                print(f"  [✓] app.js contains reference to: '{ref}'")
            else:
                print(f"  [✕] WARNING: '{ref}' reference missing in app.js!")
                warnings += 1

        # Verify key Clover endpoints are referenced correctly
        clover_endpoints = ['/items', '/tags', '/tag_items']
        for ep in clover_endpoints:
            if ep in js_content:
                print(f"  [✓] app.js references Clover endpoint: '{ep}'")
            else:
                print(f"  [✕] WARNING: Clover API route '{ep}' not found in app.js script!")
                warnings += 1

    # Final summary
    print("==================================================")
    print(f"TEST SUMMARY: {errors} Errors, {warnings} Warnings")
    print("==================================================")
    
    if errors > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    run_tests()
