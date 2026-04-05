# Chatbot UI Source Of Truth

Last updated: 2026-04-05

This document defines the frontend UI contract for the shared app/tenant chatbot widget used by:

- tenant/public business websites
- app/product surfaces that use the `frontend` repo widget

This is a UI source of truth only. Backend chat behavior, knowledge routing, and tenant chatbot settings remain owned by:

- `backend/docs/chatbot.md`

Important:

- this document does **not** own the marketing-site chatbot on `www.schedulaa.com`
- the marketing-site assistant lives in:
  - `schedulaa-marketing-techwind/src/components/shared/assistant/SchedulaaAssistant.tsx`

## 1. Scope

The chatbot redesign is:

- UI modernization only
- no backend churn
- no tenant settings redesign
- no chatbot behavior rewrite

The frontend should not change:

- `POST /chat`
- tenant chatbot config payload shape
- tenant quick reply semantics
- CTA semantics
- knowledge source flow

## 2. Primary frontend file

- `frontend/src/components/ui/ChatBot.js`

Secondary bootstrap file:

- `frontend/src/App.js`

`App.js` decides when the widget appears and whether it runs in:

- Schedulaa mode
- tenant mode

## 3. Shared widget rules

One component serves both modes.

Shared across both:

- launcher behavior
- open/close behavior
- message send behavior
- quick reply click behavior
- loading state
- CTA buttons
- mobile and desktop layout structure

The shared widget must remain a single component unless there is a strong maintenance reason to split it later.

## 3.1 Repo boundary

There are two separate chatbot UIs in the overall platform:

### This document covers

- `frontend/src/components/ui/ChatBot.js`

### This document does not cover

- `schedulaa-marketing-techwind/src/components/shared/assistant/SchedulaaAssistant.tsx`

If a change is needed on `www.schedulaa.com`, update the marketing repo widget and its own source of truth instead of this file.

## 4. Schedulaa mode

Schedulaa mode is active when there is no tenant/company slug.

Behavior:

- assistant name defaults to `Schedulaa Assistant`
- support/product messaging is platform-level
- quick replies come from Schedulaa product topics

Visual direction:

- darker premium messenger shell
- stronger product-support feel
- deeper shadows
- higher contrast bubbles
- more branded launcher

The goal is to feel like a polished support assistant for the Schedulaa platform, not a generic MUI popover.

## 5. Tenant mode

Tenant mode is active when a public tenant/company slug is present.

Behavior:

- uses tenant config:
  - `assistant_name`
  - `greeting_text`
  - `quick_replies`
  - `primary_cta`
  - `secondary_cta`
- sends `X-Company-Slug`

Visual rules:

- keep tenant accent/theme support
- do not force Schedulaa dark branding on tenant sites
- keep the improved structure, but allow tenant colors to drive the accents

Tenant mode should look more modern than before while still feeling like the tenant’s public site assistant.

## 6. UI structure

The widget consists of:

1. launcher
2. messenger shell
3. header
4. transcript/messages area
5. quick-reply chips
6. CTA row
7. composer

### Launcher

- fixed bottom-right
- stronger branded button in Schedulaa mode
- theme-aware accent button in tenant mode

### Header

- assistant avatar
- assistant name
- assistant subtitle
- online chip
- close action

### Transcript

- bot messages use assistant avatar
- user messages align right
- bot messages align left
- quick replies appear as elevated pills rather than basic outlined chips

### Composer

- rounded integrated input bar
- send button visually attached to the composer
- no change to keyboard behavior

## 7. What must remain unchanged

The redesign must not change:

- `/chat` request contract
- intro message logic
- quick reply semantics
- tenant config semantics
- CTA destination behavior
- public-vs-tenant chatbot routing logic

## 8. Recent UI upgrades in this widget

Recent app/tenant widget work included:

- premium messenger-shell redesign
- stronger Schedulaa-mode styling
- tenant-mode safe separation
- launcher, transcript, quick-reply, and composer refresh

This widget remains:

- UI-only modernization
- no backend churn
- no tenant settings redesign
- no chatbot behavior rewrite

## 9. Files to inspect before future chatbot edits

- `frontend/src/components/ui/ChatBot.js`
- `frontend/src/App.js`
- `frontend/src/utils/api.js`
- `backend/docs/chatbot.md`

Related but separate:

- `schedulaa-marketing-techwind/src/components/shared/assistant/SchedulaaAssistant.tsx`
- `schedulaa-marketing-techwind/docs/CHATBOT_UI_SOURCE_OF_TRUTH.md`

If a future change affects chat content rather than UI, update the backend/chatbot source of truth and knowledge workflow instead of only changing the frontend.
