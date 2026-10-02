# Fix the blank globe

## Changes
- Keep the current 3D globe for browsers that render it correctly.
- Add a compatible interactive globe fallback for affected Apple/WebKit browsers, using the same country data, colors, selections, filters, and country details.
- Preserve the current controls and visual design across desktop and mobile.

## Verification
- Confirm countries appear immediately on desktop and phone-sized screens.
- Test country selection, filtering, reset, and search-driven navigation.
- Confirm the preview builds without errors.
