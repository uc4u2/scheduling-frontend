from pathlib import Path
path = Path('app/routes.py')
text = path.read_text(encoding='utf-8')
old = '    svc_cents_req = d.get("service_refund_cents")\n    if svc_cents_req is None and d.get("refund_service_cents") is not None:\n        svc_cents_req = d.get("refund_service_cents")\n    svc_pct_req   = d.get("service_refund_percent")\n'
new = '    svc_cents_req = d.get("service_refund_cents")\n    if svc_cents_req is None and d.get("refund_service_cents") is not None:\n        svc_cents_req = d.get("refund_service_cents")\n    if svc_cents_req is None and d.get("amount_cents") is not None:\n        svc_cents_req = d.get("amount_cents")\n    svc_pct_req   = d.get("service_refund_percent")\n'
if old not in text:
    raise SystemExit('service cents block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
