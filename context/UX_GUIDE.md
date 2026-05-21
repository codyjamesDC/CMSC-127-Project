# UX Improvement Guide — LTO Information Management System

This guide is a concise, prioritized checklist of actionable UX improvements derived from `context/UX.md`. Use it as a work plan: implement items top-to-bottom, test, then mark complete.

## How to use
- Start with **Critical** items (accessibility & reliability).
- Implement each item with a small PR focused on one area (forms, tables, modals, dashboard).
- Add tests or manual QA checks that confirm the acceptance criteria.

## Critical (Do first)
  - What: Ensure all icon-only buttons, emoji labels, and custom controls include `aria-label` or visible/hidden text.
  - Steps: audit components → add `aria-label`/`aria-hidden` where appropriate → run screenreader spot-check.
  - Acceptance: screen reader announces meaningful names for all buttons.
 - [X] Add ARIA labels to all interactive controls

  - What: Add `id` to inputs and `htmlFor` to labels; use `required` attribute for required fields.
  - Steps: update form components → run keyboard navigation tests → verify clicking labels focuses inputs.
  - Acceptance: all inputs have associated labels programmatically.
 - [X] Link form labels to inputs

  - What: Create/standardize a confirmation modal component supporting detailed messages and contextual consequences.
  - Steps: implement modal → replace `window.confirm()` calls with modal usage → test delete flows.
  - Acceptance: delete actions show in-app modal with Cancel and Confirm (red) actions.
 - [X] Replace `window.confirm()` with styled in-app confirmation modal

  - What: Create a small toast system (top-right) that persists 3–4s and supports success/error variants.
  - Steps: add toast component → wire to form save flows → ensure toasts appear after modal close.
  - Acceptance: successful saves show persistent toast; failures show error with reason.
 - [X] Add toast/snackbar for save success/failure

  - What: Implement server-side or client-side pagination and a per-page selector (10/25/50). For very large data use virtualization.
  - Steps: API: support `?page=&limit=` → table component: add pagination controls → update list queries.
  - Acceptance: tables load limited records and allow navigation across pages.

  - What: Adjust `--lto-text-muted` to reach WCAG AA (≥4.5:1) and test badges.
  - Steps: update CSS variable → run contrast checker → verify visual harmony.
  - Acceptance: muted text passes 4.5:1 contrast.
 - [X] Fix color-contrast issues for muted text

## High
- Map validation keys to human-readable labels
  - What: Create a dictionary mapping snake_case keys to readable labels used by `validation.js` and form error UI.
  - Steps: add mapping file → update validation error formatter → display inline messages below fields.
  - Acceptance: errors show friendly labels and inline field highlighting.

- Add table captions / `aria-label`s and focusable headers
  - What: Ensure every data table has a `<caption>` or `aria-label`, and sortable headers are keyboard accessible.
  - Steps: add captions → ensure headers have `role="button"` and `tabindex` → add focus styles.
  - Acceptance: screen reader users can identify table purpose and sort via keyboard.

- Add status icons to accompany color-only badges
  - What: Display a short icon or letter before status text (e.g., ✓ Active, ⚠ Expired).
  - Steps: update badge component → ensure icons have `aria-hidden` and textual labels.
  - Acceptance: status conveyed by color + icon.

## Medium
- Break long modal forms into sections or a wizard
  - What: Group fields into logical sections (Personal, Physical, License, Contacts, Addresses) or implement stepper UI.
  - Steps: redesign modal → progressively enhance form validation per step → preserve save/draft behavior.
  - Acceptance: forms are navigable by section and less than ~8 fields per view.

- Add Organ Donor toggle to Driver form
  - What: Add a checkbox/toggle in Personal Information section wired to the `organ_donor` field.
  - Steps: update form schema → persist field with save endpoint → show value in View modal.
  - Acceptance: Organ Donor value editable and saved.

- Improve Reports page guidance and placeholders
  - What: Replace ambiguous labels like "Driver ID" with clear terms and examples (e.g., "Driver License Number — e.g., N01-23-456789").
  - Steps: update field labels and placeholders → add one-line description under each report header.
  - Acceptance: reports include example input formats.

## Low
- Add a skip-to-main-content link
  - What: Add a focusable skip link as the first element to jump to `#main-content`.
  - Acceptance: keyboard users can bypass navigation.

- Add clear focus styles across interactive elements
  - What: Restore focus outlines for `.btn`, `.form-control`, `.nav-item`.
  - Acceptance: visible focus ring appears for keyboard navigation.

- Make "Forgot Password?" show guidance
  - What: Make the button show a modal/text instructing users to contact admin.
  - Acceptance: clicking shows next steps instead of dead UI.

## Implementation tips
- Keep changes small and testable: one PR per component type (forms, tables, modals).
- Use automated accessibility tools (`axe`, Lighthouse) and manual keyboard/screen reader checks.
- Create a QA checklist per PR: keyboard-only navigation, screen reader announce, visual regression.

## Acceptance Criteria (project-level)
- No new accessibility regressions introduced.
- Critical items implemented and verified manually.
- UX improvements shipped incrementally; each PR updates `context/UX.md` status and marks completed items in this guide.

---

Generated from `context/UX.md` — implement in this priority order and mark items as done in the file when complete.
