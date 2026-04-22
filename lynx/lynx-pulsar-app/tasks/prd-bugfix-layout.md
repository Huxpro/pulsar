# PRD: Fix Layout & Visual Bugs

## Introduction

The initial 16-story implementation builds and runs, but has critical visual bugs discovered via on-device testing. This PRD addresses the 4 bugs found, in priority order.

## Verification Protocol

**Every story MUST follow these steps:**

1. **Lynx docs check**: Before using any CSS property or element, consult lynxjs.org or the `lynx-docs` MCP to verify it works in Lynx.
2. **Reference working code**: The `lynx-pulsar-demo` project at `lynx/lynx-pulsar-demo/` is CONFIRMED working on device. Copy its patterns for layout, show/hide, and styling.
3. **DevTool screenshot**: After `npm run build`, use `/devtool` skill (`node <skill_dir>/scripts/index.mjs take-screenshot`) to capture the device screen. Visually verify the fix.
4. **No silent failures**: If something doesn't render, use DevTool `get-console` to check for errors.

## Reference: Working Demo App

The `lynx-pulsar-demo` project works correctly. Key patterns from its CSS:
```css
.page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.tab-content {
  flex: 1;
  overflow: hidden;
}
.tab-panel {
  flex: 1;
  overflow: hidden;
}
```

## User Stories

### BF-001: Fix Tab Panel Show/Hide

**Bug:** Inactive tab panels bleed through — "Playground" title visible on Home, Presets, and Demos tabs. `display: none` does not fully hide elements.

**Root Cause:** In Lynx, `display: none` on a flex child may not work reliably. The `lynx-pulsar-demo` uses `overflow: hidden` on parent containers.

**Acceptance Criteria:**
- [ ] Only the active tab's content is visible. No text/elements from other tabs bleed through.
- [ ] Copy the exact show/hide pattern from `lynx-pulsar-demo/src/App.css` (`.tab-content` and `.tab-panel` with `overflow: hidden`)
- [ ] Test by switching between all 4 tabs — each shows ONLY its own content
- [ ] Take DevTool screenshot of each tab to verify
- [ ] `npm run build` passes

**Investigation steps:**
1. Read `lynx-pulsar-demo/src/App.tsx` to see how it handles tab panel show/hide
2. Read `lynx-pulsar-demo/src/App.css` for the working CSS
3. Apply the same pattern to `lynx-pulsar-app`
4. If `display: none` still doesn't work, try alternative: `position: absolute` + offscreen positioning

---

### BF-002: Fix Preset Image Loading

**Bug:** Preset card image areas are empty — no visualization PNGs render.

**Root Cause:** Imported PNG URLs from Rspeedy may not resolve correctly in the Lynx native runtime. The dev server serves the bundle JS at `http://host:3001/main.lynx.bundle`, but image URLs may be relative paths that the native image loader can't fetch.

**Acceptance Criteria:**
- [ ] At least the first 3 preset cards show their visualization images
- [ ] Images display at correct aspect ratio in the 160px container
- [ ] If imports don't work, try alternative: serve images from public folder or use absolute dev server URLs
- [ ] Take DevTool screenshot of Presets tab showing images
- [ ] `npm run build` passes

**Investigation steps:**
1. Use DevTool `get-console` to check for image loading errors
2. Check what URL the imported PNG resolves to at runtime (use `Runtime.evaluate` via CDP)
3. Try `<image src="http://localhost:3001/static/image/Afterglow.xxx.png" />` with the actual built asset URL
4. If that works, adjust the import strategy

---

### BF-003: Fix Playground Grid Sizing

**Bug:** The playground gesture grid area has 0 height — only the title, timer, and buttons are visible. The grid (where you tap/drag) is invisible.

**Root Cause:** `.pg-grid` has `flex: 1` but the flex chain from root to grid may be broken, causing it to collapse.

**Acceptance Criteria:**
- [ ] The playground grid area fills the space between the title and the control buttons
- [ ] Grid has a visible background and border
- [ ] Tapping the grid area registers touch events
- [ ] Take DevTool screenshot of Playground tab showing the grid
- [ ] `npm run build` passes

**Investigation steps:**
1. Check if the parent chain (`.page` → `.tab-content` → `.tab-panel` → playground wrapper → `.pg-grid`) all have proper flex sizing
2. Try giving `.pg-grid` an explicit `min-height` as fallback
3. Verify with DevTool DOM inspection that the grid element exists and has non-zero dimensions

---

### BF-004: Fix Demos Tab Content

**Bug:** Demos tab shows empty content — the 7 demo cards are not visible.

**Root Cause:** Likely cascading from BF-001 (tab panel overlap) or the demos content having 0 height. The demos use nested show/hide (menu + 7 demo views), which adds complexity.

**Acceptance Criteria:**
- [ ] Demos tab shows "Haptics demos" title and 7 demo cards
- [ ] Tapping a demo card navigates to that demo's view
- [ ] Back button returns to the demo menu
- [ ] Take DevTool screenshot of Demos tab showing cards
- [ ] `npm run build` passes

**Investigation steps:**
1. Fix BF-001 first — this may resolve the demos issue automatically
2. Check if the nested `display: none` pattern works for demo sub-views
3. Verify the demo card `.map()` renders correctly

## Non-Goals

- No new features — this is purely bug fixes
- Don't change the data model or add/remove presets
- Don't modify the demo logic (haptic patterns, timers, etc.)

## Technical Notes

- The `lynx-pulsar-demo` project is the reference for what works. When in doubt, copy its CSS patterns.
- All inline style values must use string `"px"` units (already fixed in previous pass)
- Use DevTool's `DOM.getDocument` and `DOM.getBoxModel` to inspect element dimensions if layout is unclear
