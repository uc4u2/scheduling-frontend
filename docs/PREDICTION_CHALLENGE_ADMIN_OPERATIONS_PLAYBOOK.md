# Prediction Challenge Admin Operations Playbook

This is the short operational playbook for running the Football Prediction Challenge during launch week and the following tournament weeks.

Use this together with:
- `frontend/docs/PREDICTION_CHALLENGE_SOURCE_OF_TRUTH.md`

All times below are UTC unless stated otherwise.

## 1. Launch Week

### Production state to confirm before Day 1
- `world_cup_2026` campaign exists
- fixtures imported
- daily bonus questions seeded for group-stage matchdays
- daily active draws seeded for group-stage matchdays
- Week 1 weekly share draw exists
- grand prize draw exists

### Day 1 launch checklist
Before the first kickoff of the first matchday:

1. Open `/admin/prediction`
2. Confirm first daily bonus question is `open`
3. Confirm first daily draw is `open`
4. Confirm first daily draw prize is correct
   - default: `$25 Gift Card`
5. Confirm Week 1 weekly share draw is `open`
6. Confirm Week 1 weekly share prize is correct
   - current launch value: `$50 Gift Card`
7. Confirm later daily draws remain `draft`
8. Confirm Week 2 and Week 3 weekly share draws remain `draft`
9. Confirm grand prize draw remains `draft` unless intentionally activated

### Day 1 tenant checks
Using a normal manager user:

1. Open `Football Predictions`
2. Confirm `Weekly Challenge` saves predictions
3. Confirm `Today` shows the current daily bonus on the real matchday
4. Confirm `Today` prize card reflects the real open daily draw
5. Confirm `Prizes` page shows Daily / Weekly / Grand cards clearly

## 2. Week-End Draw Operations

Use this sequence at the end of every weekly prize window.

### Standard sequence
1. Wait until the weekly draw cutoff has passed
2. Open the weekly draw in `/admin/prediction` -> `Draws`
3. Generate entries
4. Review frozen eligible entries
5. Run draw
6. Review created award
7. Publish winners
8. Confirm winner appears on tenant `Prizes` page

### Important rules
- never run the draw before the cutoff passes
- entries must be frozen from the cutoff snapshot
- do not publish test winners
- if a draw was used for testing only, keep it in `draft` or mark it clearly as `TEST`

## 3. Daily Prize Operations

### Daily prize model
- one `daily_active` draw per real group-stage UTC matchday
- no daily draw for off days
- qualification is based on that draw's `daily_key`

### Default daily prize configuration
- title: `Daily Prize - YYYY-MM-DD`
- prize name: `Daily prizes start at $25`
- prize value: `2500`
- status: `draft`

### Recommended daily operations
Before each matchday:
1. Confirm that day's daily bonus question exists
2. Confirm that day's daily draw exists
3. Set or confirm:
   - `starts_at_utc`
   - `cutoff_at_utc`
   - `draw_at_utc`
4. Update sponsor info or prize wording if needed
5. Change draw status to `open`

After the cutoff passes:
1. Generate entries
2. Review frozen eligible entries
3. Run draw
4. Publish winners when ready

### Daily launch note
For launch day, the live daily prize was configured as:
- prize: `$25 Gift Card`
- value: `2500`

## 4. Weekly Prize Operations

### Weekly share qualification
Current weekly share requirements:
- `1` qualified referral
- `3` saved predictions
- before that week's cutoff

### Weekly share prize values
Current launch weekly share value:
- `$50 Gift Card`
- `5000`

### Recommended activation schedule

#### Week 1
- open before first Week 1 kickoff
- current production state: `open`

#### Week 2
Recommended timing:
- open immediately after Week 1 cutoff workflow is completed

Recommended sequence:
1. finish Week 1 generate -> run -> publish flow
2. open `Weekly Share Draw - Group Week 2`
3. confirm:
   - prize is `$50 Gift Card`
   - required referrals = `1`
   - required predictions = `3`
   - required week key = `group_week_2`

#### Week 3
Recommended timing:
- open immediately after Week 2 cutoff workflow is completed

Recommended sequence:
1. finish Week 2 generate -> run -> publish flow
2. open `Weekly Share Draw - Group Week 3`
3. confirm:
   - prize is `$50 Gift Card`
   - required referrals = `1`
   - required predictions = `3`
   - required week key = `group_week_3`

## 5. Grand Prize Operations

### Current grand prize status
Recommended launch posture:
- keep grand prize draw in `draft` through Week 1

### Grand prize qualification
Current grand prize requirements:
- `5` qualified referrals
- `10` predictions
- before the grand cutoff

### Current grand prize wording
- prize name: `Sponsor-supported grand prize`
- if exact value is not set, tenant UI falls back to the approximate value messaging

### Recommended activation timing
Best practice:
- open grand prize during Week 2 or early Week 3
- only after sponsor wording, cutoff, and draw timing are confirmed

### Grand prize preparation checklist
Before opening:
1. confirm final public prize wording
2. confirm cutoff date
3. confirm draw date
4. confirm sponsor note if applicable
5. confirm substitution wording remains accurate

### Grand prize run sequence
After the grand cutoff passes:
1. generate entries
2. review eligible entries
3. run draw
4. review award
5. publish winner

## Quick Weekly Rhythm

### End of Week 1
1. close Week 1 by cutoff
2. generate entries
3. run draw
4. publish winners
5. open Week 2 draw

### End of Week 2
1. close Week 2 by cutoff
2. generate entries
3. run draw
4. publish winners
5. open Week 3 draw
6. decide whether to open grand draw if still draft

### End of Week 3
1. close Week 3 by cutoff
2. generate entries
3. run draw
4. publish winners
5. confirm grand prize live plan and cutoff communication

## Do Not Do
- do not publish test winners
- do not run draws before cutoff
- do not assume late activity counts after cutoff
- do not create daily draws for off days
- do not expose sponsor following as a requirement to enter or win
