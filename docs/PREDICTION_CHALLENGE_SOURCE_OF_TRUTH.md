# Prediction Challenge Source of Truth

This document is the operational source of truth for the Football Prediction Challenge. It is intentionally mirrored into both `backend/docs/` and `frontend/docs/` so both repos carry the same implementation map.

## 1. Scope

The Prediction Challenge covers:
- campaign setup
- fixture import and match management
- weekly score predictions
- result entry and match scoring
- leaderboard and profile identity
- referrals and referral qualification
- draw-based prizes
- daily bonus questions
- daily activity / streak UI
- tenant prediction UI
- platform admin prediction UI

It does **not** cover:
- external football API sync
- RSS/news
- public landing pages
- auth redesign
- sponsor tables
- image uploads
- betting / gambling mechanics

## 2. Repos and Primary File Map

### Backend repo
- Models: `backend/app/models.py`
- Tenant prediction routes and helpers: `backend/app/routes.py`
- Platform admin prediction routes and helpers: `backend/app/blueprints/platform_admin.py`
- Prediction fixture seed data: `backend/app/data/` (prediction fixture seed JSON lives here)
- Migrations:
  - `backend/migrations/versions/20260606_add_prediction_phase1_foundation.py`
  - `backend/migrations/versions/20260606_add_prediction_phase2a_referrals_draws.py`
  - `backend/migrations/versions/20260606_add_prediction_phase2b_daily_engagement.py`
  - `backend/migrations/versions/20260606_add_prediction_profile.py`

### Frontend repo
- Tenant shell: `frontend/src/pages/prediction/PredictionShell.jsx`
- Tenant API client: `frontend/src/pages/prediction/predictionApi.js`
- Prediction admin page: `frontend/src/admin/pages/PredictionAdminPage.jsx`
- Prediction admin API client: `frontend/src/admin/api/predictionAdminApi.js`
- Shared prediction view helpers: `frontend/src/pages/prediction/predictionViewUtils.js`
- Team identity system: `frontend/src/pages/prediction/predictionTeamIdentity.js`
- Prediction pages directory: `frontend/src/pages/prediction/`
- Locales:
  - `frontend/src/locales/en/common.json`
  - `frontend/src/locales/fa/common.json`
  - `frontend/src/locales/ru/common.json`
  - `frontend/src/locales/zh/common.json`

## 3. Database Model Map

Implemented in `backend/app/models.py`.

### Core campaign and gameplay tables
- `PredictionCampaign`
  - campaign registry
  - key example: `world_cup_2026`
- `PredictionMatch`
  - one row per fixture / match
  - stores kickoff, lock time, stage, week, status, teams, venue metadata, actual score
- `PredictionPick`
  - one recruiter prediction per match
  - stores predicted score, status, points awarded, scoring timestamps
- `PredictionAuditLog`
  - admin and system audit history for prediction actions

### Referrals and prize tables
- `PredictionReferralCode`
  - one referral code per recruiter per campaign
- `PredictionReferral`
  - referral relationship and qualification status
- `PredictionDraw`
  - prize draw definition
  - draw types in active use:
    - `daily_active`
    - `weekly_share`
    - `grand_referral`
- `PredictionDrawEntry`
  - frozen eligibility snapshot rows used when a draw runs
- `PredictionPrizeAward`
  - persisted winner / award records

### Daily engagement tables
- `PredictionDailyBonusQuestion`
  - one daily bonus question per seeded matchday by default
- `PredictionDailyBonusAnswer`
  - one answer per recruiter per question

### Leaderboard identity table
- `PredictionProfile`
  - optional per-campaign profile for leaderboard / winners
  - fields:
    - `display_name`
    - `emoji_avatar`
    - `favorite_team_name`
  - unique index:
    - `(campaign_id, recruiter_id)`

## 4. Migration Inventory

### `20260606_add_prediction_phase1_foundation.py`
Creates the prediction foundation:
- campaign
- matches
- picks
- audit logs
- initial World Cup 2026 campaign seed

### `20260606_add_prediction_phase2a_referrals_draws.py`
Adds:
- referral code
- referral rows
- draws
- draw entries
- prize awards

### `20260606_add_prediction_phase2b_daily_engagement.py`
Adds:
- daily bonus questions
- daily bonus answers

### `20260606_add_prediction_profile.py`
Adds:
- prediction profile

Migration safety notes:
- all current prediction migrations are additive
- `prediction_profile` is additive only
- nullable profile fields are safe for existing users
- users without profiles must continue to fall back to existing display-name logic

## 5. Backend Tenant Route Map

Implemented in `backend/app/routes.py`.

### General tenant / manager auth helpers
- `_prediction_current_recruiter_from_jwt()`
- `_prediction_require_manager()`
- `_prediction_get_campaign()`

### Core match and prediction helpers
- `_prediction_match_to_dict()`
- `_prediction_match_is_placeholder()`
- `_prediction_match_is_locked()`
- `_prediction_pick_to_dict()`
- `_prediction_pick_derived_status()`
- `_prediction_score_pick()`
- `_prediction_score_match_picks()`

### Leaderboard and identity helpers
- `_prediction_profile_to_dict()`
- `_prediction_display_name()`
- `_prediction_validate_profile_payload()`
- `_prediction_get_profile()`
- `_prediction_build_leaderboard()`

### Referral and draw eligibility helpers
- `_prediction_generate_referral_code()`
- `_prediction_get_or_create_referral_code()`
- `_prediction_resolve_referral()`
- `_prediction_prediction_count_before()`
- `_prediction_today_activity_count_before()`
- `_prediction_qualified_referral_count_before()`
- `_prediction_refresh_referral_qualification_for_recruiter()`
- `_prediction_draw_progress_for_recruiter()`
- `_prediction_draw_to_dict()`
- `_prediction_draw_entry_to_dict()`
- `_prediction_prize_award_to_dict()`

### Daily engagement helpers
- `_prediction_daily_key_from_utc()`
- `_prediction_get_current_daily_key()`
- `_prediction_get_matches_for_daily_key()`
- `_prediction_get_next_matches()`
- `_prediction_get_recent_scored_picks()`
- `_prediction_daily_bonus_is_locked()`
- `_prediction_get_daily_bonus_question()`
- `_prediction_get_daily_bonus_answer()`
- `_prediction_daily_bonus_required_matches()`
- `_prediction_compute_daily_completion()`
- `_prediction_compute_matchday_streak()`
- `_prediction_score_daily_bonus_question()`
- `_prediction_build_activity_feed()`

### Tenant endpoints
- `GET /prediction/home`
- `GET /prediction/today`
- `GET /prediction/daily-bonus/today`
- `POST /prediction/daily-bonus/answers`
- `GET /prediction/activity-feed`
- `GET /prediction/matches/weekly`
- `POST /prediction/picks/bulk-save`
- `GET /prediction/my-predictions`
- `GET /prediction/fixtures`
- `GET /prediction/leaderboard`
- `GET /prediction/profile`
- `POST /prediction/profile`
- `POST /prediction/referrals/resolve`
- `GET /prediction/referrals/me`
- `GET /prediction/draws/eligibility/me`
- `GET /prediction/prizes`
- `GET /prediction/rules`

### Deprecated / boundary routes
These tenant-denied admin stubs exist only to enforce separation:
- `GET|POST /prediction/admin/matches`
- `PATCH /prediction/admin/matches/<id>`

Tenant users must not use those for real admin work.

## 6. Backend Admin Route Map

Implemented in `backend/app/blueprints/platform_admin.py`.

### Shared admin helpers
- `_prediction_now_utc()`
- `_prediction_to_utc()`
- `_prediction_parse_utc_datetime()`
- `_prediction_get_campaign()`
- `_prediction_match_to_dict()`
- `_prediction_audit_log()`
- `_prediction_draw_rules_snapshot()`
- `_prediction_draw_status_summary()`
- `_prediction_draw_eligibility_snapshot()`
- `_prediction_run_draw()`
- `_prediction_daily_bonus_to_admin_dict()`

### Fixture seed helpers
- `_prediction_seed_file_path()`
- `_prediction_load_fixture_seed()`
- `_prediction_local_to_utc()`
- `_prediction_normalize_fixture_seed_row()`
- `_prediction_validate_fixture_seed()`
- `_prediction_import_fixtures()`

### Default draw seeding helpers
- `_prediction_seed_default_draw_payloads()`
- `_prediction_seed_daily_active_draw_payloads()`

### Daily bonus seeding helpers
- `_prediction_slugify_team_name()`
- `_prediction_daily_bonus_match_options()`
- `_prediction_daily_bonus_team_options()`
- `_prediction_daily_bonus_count_options()`
- `_prediction_daily_bonus_yes_no_options()`
- `_prediction_daily_bonus_range_options()`
- `_prediction_daily_bonus_payload_for_type()`
- `_prediction_seed_daily_bonus_payloads()`

### Admin endpoints
- `GET /platform-admin/prediction/campaigns`
- `GET /platform-admin/prediction/matches`
- `POST /platform-admin/prediction/matches`
- `PATCH /platform-admin/prediction/matches/<id>`
- `POST /platform-admin/prediction/matches/<id>/set-result`
- `POST /platform-admin/prediction/recalculate`
- `GET /platform-admin/prediction/leaderboard`
- `GET /platform-admin/prediction/audit-logs`
- `GET /platform-admin/prediction/fixtures/seed-preview`
- `POST /platform-admin/prediction/fixtures/import-seed`
- `GET /platform-admin/prediction/draws`
- `POST /platform-admin/prediction/draws`
- `POST /platform-admin/prediction/draws/seed-defaults`
- `POST /platform-admin/prediction/draws/seed-daily-active`
- `PATCH /platform-admin/prediction/draws/<id>`
- `POST /platform-admin/prediction/draws/<id>/generate-entries`
- `POST /platform-admin/prediction/draws/<id>/run`
- `POST /platform-admin/prediction/draws/<id>/publish`
- `GET /platform-admin/prediction/draws/<id>/entries`
- `GET /platform-admin/prediction/draws/<id>/awards`
- `POST /platform-admin/prediction/awards/<id>/status`
- `GET /platform-admin/prediction/referrals`
- `POST /platform-admin/prediction/referrals/<id>/disqualify`
- `GET /platform-admin/prediction/daily-bonus`
- `POST /platform-admin/prediction/daily-bonus`
- `PATCH /platform-admin/prediction/daily-bonus/<id>`
- `POST /platform-admin/prediction/daily-bonus/<id>/score`
- `POST /platform-admin/prediction/daily-bonus/score-ready`
- `POST /platform-admin/prediction/daily-bonus/seed-from-fixtures`

## 7. Daily Bonus Automation

### Supported question types
Implemented in backend scoring and admin seeding logic:
- `most_goals_match`
- `total_goals_range`
- `any_draw_today`
- `biggest_margin_match`
- `fewest_goals_match`
- `clean_sheet_count`
- `draw_count`
- `any_team_3_plus_goals`
- `both_teams_score_count`
- `most_goals_team`

### Scoring behavior
All daily bonus question types are based only on final scores.

#### Match-based question types
- `most_goals_match`
- `biggest_margin_match`
- `fewest_goals_match`

Rules:
- one option per match
- option key format: `match_<id>`
- ties are accepted via multiple correct option keys

#### Team-based question type
- `most_goals_team`

Rules:
- one option per team appearing that day
- option key format: `team_<slug_or_code>`
- ties are accepted via multiple correct option keys

#### Range/count/yes-no types
- `total_goals_range`
  - buckets: `0-4`, `5-8`, `9-12`, `13+`
- `clean_sheet_count`
  - buckets: `0`, `1`, `2`, `3+`
- `draw_count`
  - buckets: `0`, `1`, `2`, `3+`
- `both_teams_score_count`
  - buckets: `0`, `1`, `2`, `3+`
- `any_draw_today`
  - `Yes` / `No`
- `any_team_3_plus_goals`
  - `Yes` / `No`

### Group-stage seeding rules
Current implementation:
- only seeds for days that have matches
- only group-stage matchdays by default
- uses UTC date from `kickoff_at_utc`
- one question per `daily_key`
- skips off days
- skips days that already have questions unless `replace=true`
- uses a fixed rotation of question types

### Expected question count
With the current World Cup 2026 fixture seed, UTC group-stage matchdays run from:
- `2026-06-11`
- through `2026-06-28`

Expected seeded group-stage daily bonus question count: `18`

## 8. Prize and Draw System

### Draw types
- `daily_active`
- `weekly_share`
- `grand_referral`

### Daily Prize behavior
- default copy: daily prizes start at `$25`
- default `prize_value_cents = 2500`
- admin can edit:
  - title
  - prize name
  - value
  - sponsors
  - public note
  - cutoff
  - draw time
  - status

### Daily draw eligibility
A recruiter qualifies before cutoff if they:
- answer that day’s Daily Bonus
- OR save at least one prediction for a match on that UTC challenge day

Entries are then frozen into `PredictionDrawEntry` rows.

### Weekly Share Prize behavior
Eligibility combines:
- required qualified referrals
- required predictions before cutoff
- usually scoped to a specific week key

### Grand Prize behavior
Eligibility combines:
- qualified referrals target
- prediction target
- global grand cutoff

### Published winners
Published winners shown to users come from `PredictionPrizeAward`.

## 9. Match Scoring Rules

Implemented in `_prediction_score_pick()` in `backend/app/routes.py`.

Per match:
- exact score = `5`
- correct outcome = `2`
- correct home-team goals = `1`
- correct away-team goals = `1`
- maximum per match = `5`

Examples:
- predict `2-1`, actual `2-1` -> `5`
- predict `1-0`, actual `2-1` -> `2`
- predict `2-0`, actual `2-1` -> `3`
- predict `2-2`, actual `2-1` -> `1`

Daily bonus points do **not** affect the main match leaderboard.

## 10. Rules and Compliance Copy

### User-facing rules source
- backend response source: `GET /prediction/rules` in `backend/app/routes.py`
- frontend rendering: `frontend/src/pages/prediction/PredictionRulesPage.jsx`

### Rules topics currently covered
- free to enter / no purchase necessary
- how to play
- when predictions lock
- how points work
- referral qualification
- how prize winners are chosen
- daily bonus rules
- streak rules
- sponsor note
- following sponsors is optional
- prize categories
- grand prize substitution language

### Important compliance boundaries
Must remain true in copy:
- not betting / gambling
- no purchase necessary
- following sponsors is optional
- sponsor support does not change eligibility mechanics
- UTC / backend time is the source of truth for locking and prize windows

## 11. Frontend Tenant UI Map

### Shell and navigation
- `frontend/src/pages/prediction/PredictionShell.jsx`

Tabs:
- Home
- Today
- Weekly Challenge
- Fixtures
- My Predictions
- Leaderboard
- Referrals
- Prizes
- Rules

### Core pages
- `PredictionHomePage.jsx`
- `PredictionTodayPage.jsx`
- `PredictionWeeklyPage.jsx`
- `PredictionFixturesPage.jsx`
- `PredictionMyPredictionsPage.jsx`
- `PredictionLeaderboardPage.jsx`
- `PredictionReferralsPage.jsx`
- `PredictionPrizesPage.jsx`
- `PredictionRulesPage.jsx`

### Shared components
- `PredictionHero.jsx`
- `PredictionStatCard.jsx`
- `PredictionProgressBar.jsx`
- `PredictionCountdownChip.jsx`
- `PredictionPrizeStatusCard.jsx`
- `PredictionSponsorBadge.jsx`
- `PredictionEmptyState.jsx`
- `PredictionProfileCard.jsx`
- `PredictionTeamBadge.jsx`
- `PredictionMatchHeader.jsx`
- `PredictionMatchPredictionCard.jsx`
- `PredictionTodayMatchesCard.jsx`
- `PredictionRecentResultsCard.jsx`
- `PredictionActivityFeed.jsx`
- `PredictionDailyBonusCard.jsx`
- `PredictionStreakCard.jsx`

### Team identity system
- `frontend/src/pages/prediction/predictionTeamIdentity.js`

Responsibilities:
- team name mapping
- ISO/flag class lookup
- short code lookup
- placeholder detection
- optional team accent colors

### Tenant API client
- `frontend/src/pages/prediction/predictionApi.js`

## 12. Frontend Admin UI Map

### Main page
- `frontend/src/admin/pages/PredictionAdminPage.jsx`

Tabs:
- Campaign
- Fixtures
- Matches
- Results
- Leaderboard
- Daily Bonus
- Draws
- Referrals
- Awards
- Audit Logs

### Admin API client
- `frontend/src/admin/api/predictionAdminApi.js`

### Admin responsibilities by tab
- Campaign
  - verify campaign registry / active state
- Fixtures
  - preview fixture seed
  - import fixtures
- Matches
  - create / edit matches
  - inspect lock and kickoff times
- Results
  - set actual score
  - save result and score
  - recalculate match/week/campaign scoring
- Leaderboard
  - inspect admin leaderboard state
- Daily Bonus
  - create/edit questions
  - seed from fixtures
  - score one or score-ready
- Draws
  - create/edit draws
  - seed default draws
  - seed daily draws
  - generate entries
  - run draw
  - publish winners
- Referrals
  - inspect and disqualify referrals
- Awards
  - update award status
- Audit Logs
  - inspect operational history

## 13. Timezone Source of Truth

### Canonical frontend timezone helpers
- `frontend/src/utils/timezone.js`
- `frontend/src/utils/datetime.js`

### Prediction-specific formatting helpers
- `frontend/src/pages/prediction/predictionViewUtils.js`

Key helpers:
- `getPredictionViewerTimezone()`
- `formatViewerDateTimeLabel()`
- `formatViewerTimezoneLabel()`
- `formatUtcLabel()`

### Rule
- UI should show user/admin local time using the shared timezone helpers
- API payloads and source-of-truth fields remain UTC where the route expects UTC
- tenant and admin prediction list/detail surfaces must not dump raw ISO timestamps directly

### Current prediction timezone policy
- challenge day and daily bonus grouping are based on UTC date
- lock logic is based on backend UTC
- display time should be viewer-local wherever possible
- UTC remains visible where legal/operational clarity matters

## 14. Localization Source of Truth

### Locale files
- `frontend/src/locales/en/common.json`
- `frontend/src/locales/fa/common.json`
- `frontend/src/locales/ru/common.json`
- `frontend/src/locales/zh/common.json`

### Prediction translation scope
Prediction UI uses `prediction.*` keys inside `common.json`.

### Known boundary
The locale files handle static UI text only.
These can still appear in source language if authored directly by admins:
- daily bonus titles/descriptions/options
- sponsor public notes
- custom draw titles
- activity feed items sourced from backend content strings

## 15. Profile Identity Source of Truth

### Backend
- model: `PredictionProfile`
- routes:
  - `GET /prediction/profile`
  - `POST /prediction/profile`
- validation helper:
  - `_prediction_validate_profile_payload()`

### Frontend
- API client:
  - `getPredictionProfile()`
  - `savePredictionProfile()`
- UI component:
  - `PredictionProfileCard.jsx`
- current placements:
  - Home
  - Leaderboard

### Allowed emoji avatars
Fixed allowlist enforced by backend.

### Fallback rule
If no prediction profile exists:
- use existing recruiter display fallback
- never expose email

## 16. User Flow Map

### Weekly prediction flow
1. user opens Weekly Challenge
2. frontend calls `GET /prediction/matches/weekly`
3. user edits score inputs
4. frontend posts `POST /prediction/picks/bulk-save`
5. picks remain editable until lock
6. admin enters result later
7. backend scores picks
8. leaderboard updates

### Daily engagement flow
1. user opens Today page
2. frontend loads:
   - `GET /prediction/today`
   - `GET /prediction/prizes`
3. user sees today summary, streak, daily prize, daily bonus, next matches, recent results, activity
4. if daily bonus exists, user submits via `POST /prediction/daily-bonus/answers`
5. admin later scores the question
6. daily bonus points show in daily UI but not in main leaderboard

### Referral flow
1. user gets personal referral link
2. referred user resolves code
3. referred user must save at least one prediction before cutoff
4. backend refreshes qualification
5. weekly / grand progress updates

### Prize flow
1. admin creates or seeds draw
2. admin sets cutoff and draw time
3. after cutoff, admin generates entries
4. entries freeze eligibility snapshot
5. admin runs draw
6. admin publishes winners
7. users see winners on Prizes page

## 17. Admin Operating Checklist

### Match scoring
- import fixtures
- verify lock/kickoff times
- enter final result
- save result and score
- if needed, recalculate match/week/campaign
- verify leaderboard and my predictions update

### Daily bonus operation
- seed from fixtures for group stage
- review question copy/options
- set open/lock fields if needed
- after all required results exist, score question

### Daily draw operation
- seed daily draws
- keep drafts safe until configured
- set cutoff UTC and draw UTC
- open draw
- generate entries after cutoff
- run draw
- publish winners
- never publish TEST draws/winners

## 18. Files to Inspect for Common Bugs

### Scoring bug
Check:
- `backend/app/routes.py`
  - `_prediction_score_pick()`
  - `_prediction_score_match_picks()`
  - `prediction_matches_bulk_save()`
  - `prediction_leaderboard()`

### Daily bonus bug
Check:
- `backend/app/routes.py`
  - `_prediction_score_daily_bonus_question()`
  - `_prediction_compute_daily_completion()`
  - `_prediction_compute_matchday_streak()`
- `backend/app/blueprints/platform_admin.py`
  - `_prediction_seed_daily_bonus_payloads()`
  - `platform_admin_prediction_daily_bonus_seed_from_fixtures()`

### Daily draw bug
Check:
- `backend/app/blueprints/platform_admin.py`
  - `_prediction_seed_daily_active_draw_payloads()`
  - `_prediction_draw_eligibility_snapshot()`
  - `_prediction_run_draw()`
- `backend/app/routes.py`
  - `_prediction_draw_progress_for_recruiter()`

### Timezone bug
Check:
- `frontend/src/utils/timezone.js`
- `frontend/src/utils/datetime.js`
- `frontend/src/pages/prediction/predictionViewUtils.js`
- tenant/admin surfaces printing `_utc` fields directly

### Translation leak
Check:
- prediction page component hardcoded strings
- `frontend/src/locales/*/common.json`
- dynamic admin-authored content returned from backend

## 19. Launch Safety Checklist

Before deploy / rollout:
- run backend compile
- run `flask db heads`
- run frontend build
- confirm no published TEST winners
- confirm no draft-only test draws were accidentally opened
- confirm daily bonus seed count matches fixture matchdays
- confirm tenant dashboard shows no admin controls
- confirm admin uses `/admin/prediction`
- confirm leaderboard fallback works when no profile exists
- confirm prize copy remains non-promissory and sponsor-safe

## 20. Current Known Product Rules

- daily bonus points do not affect the main leaderboard
- daily draws use frozen eligibility snapshots
- group stage supports one seeded daily bonus per UTC matchday by default
- off days do not get seeded daily bonus questions
- off days do not get seeded daily prize draws
- Week 2 / Week 3 remain open for early predictions
- challenge day grouping is UTC-based, not viewer-local
- display times should still be localized for users and admins

