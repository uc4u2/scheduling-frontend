from pathlib import Path
path = Path('app/routes.py')
text = path.read_text(encoding='utf-8')
old_func = "    def _remaining_by_charge(pi_id: str):\n        pi, ch_id = _pi_snapshot(pi_id)\n        if not ch_id:\n            rem = _remaining_by_pi_math(pi_id)\n            current_app.logger.info(f\"[refund:charge_snap] pi={pi_id} ch=None remaining={rem}\")\n            return rem, None, None, None\n        try:\n            if acct:\n                ch = stripe.Charge.retrieve(ch_id, stripe_account=acct)\n            else:\n                ch = stripe.Charge.retrieve(ch_id)\n            amount = int(ch.get(\"amount\") or 0)\n            refunded = int(ch.get(\"amount_refunded\") or 0)\n            remaining = max(0, amount - refunded)\n            current_app.logger.info(f\"[refund:charge_snap] pi={pi_id} ch={ch_id} amount={amount} refunded={refunded} remaining={remaining}\")\n            return remaining, ch_id, amount, refunded\n        except Exception as e:\n            current_app.logger.error(f\"[refund:charge_snap err] pi={pi_id} ch={ch_id} {e}\")\n            rem = _remaining_by_pi_math(pi_id)\n            return rem, ch_id, None, None\n"
new_func = "    def _remaining_by_charge(pi_id: str):\n        pi, ch_id = _pi_snapshot(pi_id)\n        if not ch_id:\n            rem = _remaining_by_pi_math(pi_id)\n            current_app.logger.info(f\"[refund:charge_snap] pi={pi_id} ch=None remaining={rem}\")\n            return rem, None, None, None, None\n        try:\n            if acct:\n                ch = stripe.Charge.retrieve(ch_id, stripe_account=acct)\n            else:\n                ch = stripe.Charge.retrieve(ch_id)\n            amount = int(ch.get(\"amount\") or 0)\n            refunded = int(ch.get(\"amount_refunded\") or 0)\n            app_fee_amount = ch.get(\"application_fee_amount\")\n            if app_fee_amount is not None:\n                try:\n                    app_fee_amount = int(app_fee_amount)\n                except Exception:\n                    app_fee_amount = None\n            remaining = max(0, amount - refunded)\n            current_app.logger.info(f\"[refund:charge_snap] pi={pi_id} ch={ch_id} amount={amount} refunded={refunded} remaining={remaining}\")\n            return remaining, ch_id, amount, refunded, app_fee_amount\n        except Exception as e:\n            current_app.logger.error(f\"[refund:charge_snap err] pi={pi_id} ch={ch_id} {e}\")\n            rem = _remaining_by_pi_math(pi_id)\n            return rem, ch_id, None, None, None\n"
if old_func not in text:
    raise SystemExit('old function block not found')
text = text.replace(old_func, new_func, 1)

old_line = "        rem_charge, _, _, _ = _remaining_by_charge(pi_id)\n"
new_line = "        rem_charge, _, _, _, _ = _remaining_by_charge(pi_id)\n"
if old_line not in text:
    raise SystemExit('remaining_on_pi line not found')
text = text.replace(old_line, new_line, 1)

path.write_text(text, encoding='utf-8')
