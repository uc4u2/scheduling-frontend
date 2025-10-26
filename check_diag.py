import sys
from pathlib import Path
sys.path.insert(0, str(Path('C:/scheduler2/backend')))
from app import create_app
app = create_app()
print('fingerprint route:', any(r.rule == '/__whoami' for r in app.url_map.iter_rules()))
