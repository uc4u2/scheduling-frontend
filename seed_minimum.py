from datetime import datetime
from sqlalchemy import text

from app import create_app, db

slug = "photo-artisto"
now = datetime.utcnow()

app = create_app()
with app.app_context():
    db.session.execute(
        text(
            """
            INSERT INTO company_profile (
                name,
                slug,
                enable_auto_review_followups,
                publish_reviews_automatically,
                enable_stripe_payments,
                allow_card_on_file,
                created_at,
                updated_at
            )
            VALUES (:name, :slug, TRUE, FALSE, FALSE, FALSE, :now, :now)
            ON CONFLICT (slug) DO UPDATE
              SET updated_at = :now
            """
        ),
        {"name": "Photo Artisto", "slug": slug, "now": now},
    )

    company_id = db.session.execute(
        text("SELECT id FROM company_profile WHERE slug = :slug"), {"slug": slug}
    ).scalar()

    db.session.execute(
        text(
            """
            INSERT INTO company_website_setting (company_id, is_live)
            VALUES (:company_id, TRUE)
            ON CONFLICT (company_id) DO UPDATE
              SET is_live = TRUE
            """
        ),
        {"company_id": company_id},
    )

    db.session.execute(
        text(
            """
            INSERT INTO website_form (
                company_id,
                name,
                key,
                success_msg,
                notify_emails,
                captcha,
                created_at,
                updated_at
            )
            VALUES (
                :company_id,
                'Contact Us',
                'contact',
                'Thanks! Our team will get in touch within one business day.',
                :notify,
                FALSE,
                :now,
                :now
            )
            ON CONFLICT (company_id, key) DO UPDATE
              SET notify_emails = EXCLUDED.notify_emails,
                  success_msg   = EXCLUDED.success_msg,
                  updated_at    = :now
            """
        ),
        {"company_id": company_id, "notify": "admin@schedulaa.com", "now": now},
    )

    db.session.commit()
    print("Seed OK")
