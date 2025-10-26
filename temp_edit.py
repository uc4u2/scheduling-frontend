from pathlib import Path
text = Path('app/routes.py').read_text(encoding='utf-8')
old = "    now = datetime.utcnow()\n\n    # ----- services ------------------------------------------------------------\n"
if old not in text:
    raise SystemExit('timestamp marker not found')
new = "    now = datetime.utcnow()\n\n    try:\n        timeout_minutes = int(current_app.config.get(\"PENDING_CHECKOUT_TIMEOUT_MINUTES\", 30))\n    except (TypeError, ValueError):\n        timeout_minutes = 30\n    if timeout_minutes < 0:\n        timeout_minutes = 0\n\n    def _expire_stale_pending(minutes: int) -> None:\n        if minutes <= 0:\n            return\n        cutoff = datetime.utcnow() - timedelta(minutes=minutes)\n        stale_rows = (PendingCheckout.query\n                      .filter(PendingCheckout.company_id == company.id)\n                      .filter(PendingCheckout.updated_at != None)\n                      .filter(PendingCheckout.updated_at <= cutoff)\n                      .all())\n        released = 0\n        for row in stale_rows:\n            meta = dict(row.extra_metadata or {})\n            if meta.get(\"finalized\") or meta.get(\"released\"):\n                continue\n            cart_data = row.cart or {}\n            has_services = False\n            try:\n                services = cart_data.get(\"services\") or cart_data.get(\"items\")
                if isinstance(services, list):
                    has_services = bool(services)
                else:
                    has_services = bool(cart_data)
            except Exception:
                has_services = True
            if not has_services:
                continue
            if _release_pending_checkout(row, reason=\"expired_timeout\", commit=False, logger=current_app.logger):
                released += 1
        if released:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
                current_app.logger.exception(\"[pending-checkout] commit failed while expiring stale carts for company %s\", company.id)
            else:
                current_app.logger.info(\"[pending-checkout] expired %s stale carts for company %s\", released, company.id)

    _expire_stale_pending(timeout_minutes)

    # ----- services ------------------------------------------------------------
"
text = text.replace(old, new, 1)
Path('app/routes.py').write_text(text, encoding='utf-8')
