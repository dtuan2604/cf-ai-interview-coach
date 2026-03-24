# Testing Guide

This project currently uses a lightweight native Node test setup instead of a larger browser-oriented test runner.

## Automated Checks

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run verify`

The automated tests currently cover:

- mock interview progression logic
- prompt-builder contracts for question generation and final report generation

## Manual Smoke Checklist

Run these checks before pushing a larger change:

1. Start the Worker with `npm run dev:worker`.
2. Start the frontend with `npm run dev`.
3. Confirm the landing page, setup page, and history page render.
4. Run a text interview end to end and confirm the report page loads.
5. Run a voice interview end to end and confirm:
   - the AI speaks the opening prompt
   - speech capture waits roughly 6 seconds after silence
   - the final answer auto-redirects to the report page
6. Refresh an active interview route and confirm the Durable Object restores the session.

## Residual Gaps

- Browser speech-recognition behavior is still primarily a manual test concern because it depends on browser permissions and implementation differences.
- Workers AI output quality remains probabilistic, so fallback behavior should be checked whenever prompts or model settings change.
- Frontend Redux slices are still best covered with a browser-oriented test runner if we later decide the repo should absorb that additional tooling.
