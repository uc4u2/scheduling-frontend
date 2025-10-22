from pathlib import Path

path = Path("app/routes.py")
text = path.read_text(encoding="utf-8")
needle = "    def _refund_buckets_for_pi(pi_id: str):\n"
start = text.find(needle)
if start == -1:
    raise SystemExit("_refund_buckets_for_pi definition not found")
end_marker = "    # ---------- SERVICE refundable before this call ----------"
end = text.find(end_marker, start)
if end == -1:
    raise SystemExit("end marker not found")
new_block = "    def _refund_buckets_for_pi(pi_id: str, only_for_appointment_id: int | None = None):\n        \"\"\"\n        Return refund totals for this PaymentIntent. When only_for_appointment_id\n        is provided, restrict counts to refunds whose metadata.appointment_id matches.\n        \"\"\"\n        totals = {\"service\": 0, \"tip\": 0, \"total\": 0}\n        try:\n            if acct:\n                lst = stripe.Refund.list(payment_intent=pi_id, limit=100, stripe_account=acct)\n            else:\n                lst = stripe.Refund.list(payment_intent=pi_id, limit=100)\n            for r in (lst.get(\"data\") or []):\n                meta = (r.get(\"metadata\") or {})\n                if only_for_appointment_id is not None:\n                    appt_meta = meta.get(\"appointment_id\")\n                    try:\n                        appt_meta_id = int(str(appt_meta).strip())\n                    except Exception:\n                        appt_meta_id = None\n                    if appt_meta_id != int(only_for_appointment_id):\n                        continue\n                amt = int(r.get(\"amount\") or 0)\n                bucket = (meta.get(\"bucket\") or \"\").lower()\n                if bucket == \"service\":\n                    totals[\"service\"] += amt\n                elif bucket == \"tip\":\n                    totals[\"tip\"] += amt\n                totals[\"total\"] += amt\n        except Exception as e:\n            current_app.logger.warning(f\"[refund:refunds list warn] {pi_id}: {e}\")\n        return totals\n\n"
text = text[:start] + new_block + text[end:]
path.write_text(text, encoding="utf-8")
