from pathlib import Path
block = Path('app/routes.py').read_text(encoding='utf-8')
start = block.index('    if payment_status == "card_on_file" and setup_intent_id:')
end = block.index('    # Helpers', start)
segment = block[start:end]
for line in segment.split('\n'):
    print(repr(line))
