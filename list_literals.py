from pathlib import Path
import re
path = Path('src/pages/sections/management/VisualSiteBuilder.js')
lines = path.read_text(encoding='utf-8').splitlines()
pattern = re.compile(r'"[A-Za-z]')
for idx, line in enumerate(lines, 1):
    if pattern.search(line) and 't("' not in line and 'http' not in line:
        print(f"{idx}: {line}")
