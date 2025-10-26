import sys
from pathlib import Path
sys.path.insert(0, str(Path('C:/scheduler2/backend')))
from app import create_app
app = create_app()
with app.app_context():
    for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
        if 'candidate-forms/intake' in rule.rule:
            print(rule.rule, rule.methods)
