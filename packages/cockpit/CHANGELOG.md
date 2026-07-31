# @lumal/cockpit

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Upgrade cockpit configuration and designer/runtime behavior to schema v3, and export the reusable `LumalCockpitCard` component and card contracts.

### Patch Changes

- Fix the runtime center region collapsing to a 2px sliver. The v3 grid rule redeclared `.lumal-cockpit-canvas__center` without restating its absolute positioning, so the later rule won on equal specificity and the center pane shrank to its content height instead of filling the canvas body.
