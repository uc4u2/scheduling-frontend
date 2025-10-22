from pathlib import Path
path = Path('app/routes.py')
text = path.read_text(encoding='utf-8')
old_block = "        if pending:\n            ids = _finalize_pending_checkout(pending, sess, company, acct_id=acct)\n            created_appt_ids = list(ids or [])\n"
new_block = "        if pending:\n            status_lower = (getattr(sess, \"status\", \"\") or \"\").lower()\n            payment_status_lower = (getattr(sess, \"payment_status\", \"\") or \"\").lower()\n            session_paid = payment_status_lower == \"paid\" or status_lower == \"complete\"\n            if session_paid:\n                ids = _finalize_pending_checkout(pending, sess, company, acct_id=acct)\n                created_appt_ids = list(ids or [])\n            else:\n                current_app.logger.info(\"[checkout-session] skipping finalize for pending %s (status=%s payment_status=%s)\", pending.id, status_lower, payment_status_lower)\n"
if old_block not in text:
    raise SystemExit('pending finalize block not found')
text = text.replace(old_block, new_block, 1)
path.write_text(text, encoding='utf-8')
