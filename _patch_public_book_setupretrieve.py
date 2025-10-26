from pathlib import Path
path = Path('app/routes.py')
text = path.read_text(encoding='utf-8')
old = '        try:\n            get_stripe_api_key()\n            si = stripe.SetupIntent.retrieve(setup_intent_id)\n            pm_id = si.get("payment_method")\n            si_customer = si.get("customer")\n'
new = '        try:\n            get_stripe_api_key()\n            kwargs = {"stripe_account": acct} if acct else {}\n            si = stripe.SetupIntent.retrieve(setup_intent_id, **kwargs)\n            pm_id = si.get("payment_method")\n            si_customer = si.get("customer")\n'
if old not in text:
    raise SystemExit('public_book SetupIntent retrieve block not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
