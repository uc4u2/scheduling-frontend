from pathlib import Path
path = Path('app/routes.py')
text = path.read_text(encoding='utf-8')
old = '        si = stripe.SetupIntent.retrieve(si_id)\n'
new = '        kwargs = {"stripe_account": acct} if acct else {}\n        si = stripe.SetupIntent.retrieve(si_id, **kwargs)\n'
if old not in text:
    raise SystemExit('setupintent retrieve pattern not found in finalize')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
