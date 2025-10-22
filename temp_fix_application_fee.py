from pathlib import Path
path = Path('app/routes.py')
text = path.read_text(encoding='utf-8')
old_func = "    def _remaining_by_charge(pi_id: str):\n        pi, ch_id = _pi_snapshot(pi_id)\n        if not ch_id:\n            rem = _remaining_by_pi_math(pi_id)\n            current_app.logger.info(f\"[refund:charge_snap] pi={pi_id} ch=None remaining={rem}\")\n            return rem, None, None, None\n        try:\n            if acct:\n                ch = stripe.Charge.retrieve(ch_id, stripe_account=acct)\n            else:\n                ch = stripe.Charge.retrieve(ch_id)\n            amount = int(ch.get(\"amount\") or 0)\n            refunded = int(ch.get(\"amount_refunded\") or 0)\n            remaining = max(0, amount - refunded)\n            current_app.logger.info(f\"[refund:charge_snap] pi={pi_id} ch={ch_id} amount={amount} refunded={refunded} remaining={remaining}\")\n            return remaining, ch_id, amount, refunded\n        except Exception as e:\n            current_app.logger.error(f\"[refund:charge_snap err] pi={pi_id} ch={ch_id} {e}\")\n            rem = _remaining_by_pi_math(pi_id)\n            return rem, ch_id, None, None\n"
new_func = """    def _remaining_by_charge(pi_id: str):
        pi, ch_id = _pi_snapshot(pi_id)
        if not ch_id:
            rem = _remaining_by_pi_math(pi_id)
            current_app.logger.info(f"[refund:charge_snap] pi={pi_id} ch=None remaining={rem}")
            return rem, None, None, None, None
        try:
            if acct:
                ch = stripe.Charge.retrieve(ch_id, stripe_account=acct)
            else:
                ch = stripe.Charge.retrieve(ch_id)
            amount = int(ch.get("amount") or 0)
            refunded = int(ch.get("amount_refunded") or 0)
            app_fee_amount = ch.get("application_fee_amount")
            if app_fee_amount is not None:
                try:
                    app_fee_amount = int(app_fee_amount)
                except Exception:
                    app_fee_amount = None
            remaining = max(0, amount - refunded)
            current_app.logger.info(f"[refund:charge_snap] pi={pi_id} ch={ch_id} amount={amount} refunded={refunded} remaining={remaining}")
            return remaining, ch_id, amount, refunded, app_fee_amount
        except Exception as e:
            current_app.logger.error(f"[refund:charge_snap err] pi={pi_id} ch={ch_id} {e}")
            rem = _remaining_by_pi_math(pi_id)
            return rem, ch_id, None, None, None
"""
if old_func not in text:
    raise SystemExit('old function block not found')
text = text.replace(old_func, new_func, 1)

old_line = "        rem_charge, _, _, _ = _remaining_by_charge(pi_id)\n"
new_line = "        rem_charge, _, _, _, _ = _remaining_by_charge(pi_id)\n"
if old_line not in text:
    raise SystemExit('remaining_on_pi line not found')
text = text.replace(old_line, new_line, 1)

old_assign = "    prev_refunds = _refund_buckets_for_pi(svc_pi_id)\n    service_bucket_remaining = max(0, svc_captured_cents - prev_refunds[\"service\"])\n    pi_remaining_now = _remaining_on_pi_strict(svc_pi_id)\n    service_refundable_cents_before = max(0, min(pi_remaining_now, service_bucket_remaining))\n"
new_assign = "    prev_refunds = _refund_buckets_for_pi(svc_pi_id)\n    service_bucket_remaining = max(0, svc_captured_cents - prev_refunds[\"service\"])\n    rem_charge_info = _remaining_by_charge(svc_pi_id)\n    if isinstance(rem_charge_info, tuple) and len(rem_charge_info) == 5:\n        pi_remaining_now, svc_charge_id, svc_charge_amount, svc_charge_refunded, svc_charge_app_fee = rem_charge_info\n    else:\n        pi_remaining_now = rem_charge_info[0] if isinstance(rem_charge_info, (list, tuple)) else rem_charge_info\n        svc_charge_id = svc_charge_amount = svc_charge_refunded = None\n        svc_charge_app_fee = None\n    service_refundable_cents_before = max(0, min(pi_remaining_now, service_bucket_remaining))\n"
if old_assign not in text:
    raise SystemExit('refund assignment block not found')
text = text.replace(old_assign, new_assign, 1)

old_cond = "            if acct and refund_platform_fee:\n                refund_kwargs[\"refund_application_fee\"] = True\n"
new_cond = "            if acct and refund_platform_fee and (svc_charge_app_fee or 0) > 0:\n                refund_kwargs[\"refund_application_fee\"] = True\n"
if old_cond not in text:
    raise SystemExit('refund kwargs block not found')
text = text.replace(old_cond, new_cond, 1)

path.write_text(text, encoding='utf-8')
