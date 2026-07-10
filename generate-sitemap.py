#!/usr/bin/env python3
"""Regenerate sitemap.xml from chords.xml.

Run after adding songs:  python3 generate-sitemap.py
"""
import re
from pathlib import Path

BASE_URL = 'https://keymasterr.com/scherbakov'

here = Path(__file__).parent
xml = (here / 'chords.xml').read_text(encoding='utf-8')
track_ids = re.findall(r'<track id="([^"]+)"', xml)

urls = [f'{BASE_URL}/'] + [f'{BASE_URL}/songs/{track_id}' for track_id in track_ids]

entries = '\n'.join(f'  <url><loc>{url}</loc></url>' for url in urls)
sitemap = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'{entries}\n'
    '</urlset>\n'
)

(here / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
print(f'sitemap.xml: {len(urls)} URLs')
