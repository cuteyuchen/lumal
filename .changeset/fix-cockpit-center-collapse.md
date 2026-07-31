---
"@lumal/cockpit": patch
---

Fix the runtime center region collapsing to a 2px sliver. The v3 grid rule redeclared `.lumal-cockpit-canvas__center` without restating its absolute positioning, so the later rule won on equal specificity and the center pane shrank to its content height instead of filling the canvas body.
