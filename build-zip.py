#!/usr/bin/env python3
"""
Packaging script for Zendesk App Framework (ZAF v2)
Creates a compliant .zip package ready for direct upload to Zendesk Admin Center:
Admin Center > Apps and integrations > Zendesk Support apps > Upload private app
"""

import os
import zipfile
import json
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
OUTPUT_ZIP = os.path.join(DIST_DIR, 'zendesk-view-descriptions-app.zip')

def validate_manifest():
    manifest_path = os.path.join(BASE_DIR, 'manifest.json')
    if not os.path.exists(manifest_path):
        print("Error: manifest.json not found!")
        sys.exit(1)
        
    with open(manifest_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    required_keys = ['name', 'author', 'version', 'frameworkVersion', 'location']
    for k in required_keys:
        if k not in data:
            print(f"Warning: '{k}' is missing from manifest.json")
    print(f"Manifest validated for '{data.get('name')}' v{data.get('version')}")

def build_zip():
    os.makedirs(DIST_DIR, exist_ok=True)
    validate_manifest()

    # Files to include in root of zip
    include_paths = [
        ('manifest.json', 'manifest.json'),
        ('translations/en.json', 'translations/en.json'),
        ('assets/iframe.html', 'assets/iframe.html'),
        ('assets/style.css', 'assets/style.css'),
        ('assets/main.js', 'assets/main.js'),
        ('assets/logo.png', 'assets/logo.png'),
        ('assets/logo-small.png', 'assets/logo-small.png'),
        ('assets/icon_nav_bar.svg', 'assets/icon_nav_bar.svg'),
        ('assets/icon_top_bar.svg', 'assets/icon_top_bar.svg'),
    ]

    print(f"\nBuilding package: {OUTPUT_ZIP}")
    with zipfile.ZipFile(OUTPUT_ZIP, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for local_file, zip_path in include_paths:
            full_path = os.path.join(BASE_DIR, local_file)
            if os.path.exists(full_path):
                z.write(full_path, arcname=zip_path)
                print(f"  + Added {zip_path} ({os.path.getsize(full_path)} bytes)")
            else:
                print(f"  ! Missing file: {full_path}")

    zip_size = os.path.getsize(OUTPUT_ZIP)
    print(f"\nSuccessfully built {OUTPUT_ZIP} ({zip_size / 1024:.1f} KB)")
    print("\nNext step: Upload this zip file in Zendesk Admin Center:")
    print("  -> Admin Center > Apps and integrations > Apps > Zendesk Support apps > Upload private app")

if __name__ == '__main__':
    build_zip()
