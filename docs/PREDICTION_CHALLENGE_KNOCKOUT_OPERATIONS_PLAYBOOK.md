# Prediction Challenge Knockout Operations Playbook

This playbook covers the operational steps after the World Cup 2026 group stage ends.

Use this together with:
- `frontend/docs/PREDICTION_CHALLENGE_SOURCE_OF_TRUTH.md`
- `frontend/docs/PREDICTION_CHALLENGE_ADMIN_OPERATIONS_PLAYBOOK.md`

## 1. Core Principle

The knockout bracket skeleton is already seeded in the database.

Current fixture structure:
- total fixtures: `104`
- group-stage fixtures: `72`
- knockout placeholder fixtures: `32`

That means post-group-stage work is primarily:
1. confirm official group results
2. identify official knockout pairings
3. replace placeholder teams in existing knockout matches
4. verify prediction pages display real teams correctly

Do **not** re-import the full tournament fixture set unless the seeded bracket timing itself is wrong.

## 2. Post-Group-Stage Knockout Operations Plan

### Step 1: Finish group-stage scoring
Before touching knockout placeholders:

1. enter all remaining group-stage results
2. score all remaining group-stage matches
3. verify leaderboard recalculation is complete
4. verify no unresolved group-stage match still affects standings

### Step 2: Confirm official knockout bracket
Using the official tournament bracket:

1. confirm each advancing team
2. confirm each pairing for the next knockout round
3. confirm whether kickoff times remain the same as seeded
4. confirm venue/time adjustments if FIFA changes anything

### Step 3: Resolve seeded placeholder matches
For each upcoming knockout match:

1. locate the existing seeded `PredictionMatch` row
2. replace placeholder labels with actual teams
3. update team codes if needed
4. leave existing kickoff/lock times unchanged unless official schedule changed

### Step 4: Verify user-facing readiness
After placeholders are replaced:

1. open tenant `Fixtures`
2. open tenant `Weekly Challenge`
3. confirm real team names appear
4. confirm team badges/flags render correctly
5. confirm prediction save still works
6. confirm unresolved future rounds still show neutral placeholders without fake flags

### Step 5: Prize and daily-engagement decision
Decide whether knockout stages will keep:
- daily bonus
- daily daily-prize draws

This is a product decision, not just a technical one.

## 3. Knockout Placeholder Resolution Workflow

### What is already in DB
Knockout match rows are already present as placeholders, for example:
- `Winner Group A`
- `Runner-up Group B`
- `TBD`

These rows are safe for the frontend:
- placeholders show neutral badges
- no fake country flag is used

### What to update
For each real knockout pairing, update:
- `home_team_name`
- `away_team_name`
- `home_team_code`
- `away_team_code`

Update these only if needed:
- `kickoff_at_utc`
- `lock_at_utc`
- `venue_timezone`
- `status`

Do not create duplicate matches if the placeholder row already exists for that bracket slot.

### Recommended admin workflow
In `/admin/prediction`:

1. open `Matches`
2. filter by stage:
   - `Round of 32`
   - `Round of 16`
   - `Quarter-finals`
   - `Semi-finals`
   - `Final`
3. edit the seeded placeholder rows
4. replace placeholders with the official teams
5. save changes

### Validation after each round update
After updating a round:

1. confirm match list shows the updated teams
2. confirm there are no duplicate rows for the same bracket slot
3. confirm no placeholder remains for already-known pairings
4. confirm user pages display real teams and real flags

## 4. When New Fixture Insertion Is Actually Needed

In normal operation, you should **not** need new insertion after group stage.

Only insert new rows if:
- seeded knockout fixture rows are missing
- the bracket structure in DB is incomplete
- official tournament schedule changed enough that seeded rows are unusable

If insertion is ever required:
1. inspect existing knockout rows first
2. use the bracket slot that matches the official round
3. avoid creating duplicates
4. document the reason in admin notes or audit context

## 5. Daily Bonus / Daily Prize After Group Stage

### Current system behavior
Current daily bonus automation is built for:
- `group_stage` matchdays only

Current daily active draw seeding is based on:
- group-stage UTC matchdays with real fixtures

So after the group stage, daily engagement does **not** automatically continue unless you choose to extend it.

### Product options

#### Option A: Stop daily bonus and daily daily-prize after group stage
Use this if:
- you want simpler operations
- daily engagement is only a group-stage campaign feature

Pros:
- no extra admin work
- no new automation changes required

Cons:
- less daily engagement during knockout stages

#### Option B: Continue daily bonus and daily daily-prize through knockout stages
Use this if:
- you want ongoing daily engagement
- you want daily sponsor opportunities beyond group stage

Pros:
- keeps `Today` active through the whole tournament
- gives more prize/sponsor inventory

Cons:
- requires more operational prep
- should be implemented before the group stage ends

## 6. Recommendation on Knockout Daily Automation

Recommended product decision:

### Minimum-safe recommendation
Keep current automation as-is for now:
- group stage only

Then evaluate knockout continuation during Week 2 or Week 3.

### Best growth recommendation
Prepare a small follow-up backend/admin slice before the group stage ends:
- allow daily bonus seeding for knockout stages
- allow daily active draw seeding for knockout stages
- keep the same UTC matchday logic

This is the best path if you want the challenge to stay fully active after group stage.

## 7. Recommended Technical Follow-Up If Continuing Knockout Daily Operations

If continuing daily engagement into knockout stages, add:

1. seeded daily bonus support for knockout stage keys
2. seeded daily draw support for knockout stage keys
3. no off-day question/draw creation
4. same frozen-cutoff draw behavior
5. same daily qualification rule:
   - daily bonus answer
   - or prediction on that UTC matchday

### Suggested stage scope
Possible future seeding scope:
- `round_of_32`
- `round_of_16`
- `quarter_finals`
- `semi_finals`
- `third_place`
- `final`

## 8. Round Transition Checklist

### After group stage
1. score final group-stage matches
2. confirm official knockout bracket
3. resolve Round of 32 placeholders
4. verify Fixtures and Weekly Challenge
5. decide whether to continue daily operations into knockout stage

### After Round of 32
1. enter results
2. score matches
3. resolve Round of 16 placeholders
4. verify tenant pages

### After Round of 16
1. enter results
2. score matches
3. resolve Quarter-final placeholders
4. verify tenant pages

### After Quarter-finals
1. enter results
2. score matches
3. resolve Semi-final placeholders
4. verify tenant pages

### After Semi-finals
1. enter results
2. score matches
3. resolve Final and Third-place placeholders
4. verify tenant pages

## 9. Do Not Do

- do not duplicate knockout fixture rows if placeholder rows already exist
- do not leave resolved pairings as placeholders once the official bracket is known
- do not create fake flags for unresolved teams
- do not assume group-stage-only daily automation automatically covers knockout rounds
- do not open knockout daily prize windows unless the related matchday data is confirmed
