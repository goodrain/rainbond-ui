# Agent Mutation Jump Highlight Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the Agent is about to execute a component-level destructive or mutating action, automatically navigate `rainbond-ui` to the relevant component page and visually highlight the exact UI region or action entry point.

**Architecture:** Implement the MVP entirely in `rainbond-ui` by mapping Rainbond MCP tool names to component routes, tabs, optional sub-tabs, and stable DOM target keys. Reuse the existing Agent approval flow and component slide-panel route shape, then add a small DOM highlighter layer that can scroll to and decorate the target area. After the MVP works, add protocol-backed `ui_hint` support in `rainbond-copilot`, and optionally move long-term UI targeting metadata into `rainbond-console` MCP tool annotations.

**Tech Stack:** React 16.8 class components, DVA 2.4, Umi 3.5, Ant Design 3.19, Less, Rainbond console REST APIs, Rainbond Copilot SSE approval events.

---

## Scope

This plan covers:

1. `rainbond-ui` MVP
2. `rainbond-copilot` follow-up enhancement
3. Optional `rainbond-console` metadata convergence

The MVP should support at least these component mutation families:

- `rainbond_delete_component`
- `rainbond_manage_component_envs`
- `rainbond_manage_component_connection_envs`
- `rainbond_manage_component_dependency`
- `rainbond_manage_component_ports`
- `rainbond_manage_component_storage`
- `rainbond_manage_component_probe`
- `rainbond_manage_component_autoscaler`
- `rainbond_horizontal_scale_component`
- `rainbond_vertical_scale_component`
- `rainbond_change_component_image`

## Route and UI Target Matrix

Use this as the source of truth for the MVP mapping table:

| MCP tool | Primary UI route | Secondary UI location | Recommended target key |
|---|---|---|---|
| `rainbond_delete_component` | `tab=overview` | component header actions | `component.header.delete` |
| `rainbond_manage_component_envs` | `tab=environmentConfiguration` | custom env card | `component.env.inner` |
| `rainbond_manage_component_connection_envs` | `tab=connectionInformation` | connection env card | `component.env.outer` |
| `rainbond_manage_component_dependency` | `tab=relation` | relation main card | `component.dependency` |
| `rainbond_manage_component_ports` | `tab=advancedSettings&subTab=port` | port card | `component.port.card` |
| `rainbond_manage_component_storage` | `tab=advancedSettings&subTab=mnt` | volume card / mount card | `component.storage.volume.card` / `component.storage.mount.card` |
| `rainbond_manage_component_probe` | `tab=advancedSettings&subTab=setting` | health check card | `component.probe.card` |
| `rainbond_manage_component_autoscaler` | `tab=expansion` | autoscaler card | `component.autoscaler.card` |
| `rainbond_horizontal_scale_component` | `tab=expansion` | manual scale card | `component.scale.manual.card` |
| `rainbond_vertical_scale_component` | `tab=expansion` | manual scale card | `component.scale.manual.card` |
| `rainbond_change_component_image` | `tab=advancedSettings&subTab=resource` | build source card | `component.resource.buildsource.card` |

Important constraint:

- `advancedSettings` currently stores its inner menu state locally and does not persist it in the URL. The MVP must add `subTab` routing support before Agent-driven navigation can reliably land on `mnt`, `port`, `resource`, or `setting`.

---

### Task 1: Add a URL-driven mutation target mapping layer in `rainbond-ui`

**Files:**
- Create: `/Users/guox/Desktop/newagent/rainbond-ui/src/utils/agentMutationUiMap.js`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/utils/global.js:240-272`

**Step 1: Create the mapping module**

Add a small utility that exports:

- `getAgentMutationUiTarget(toolName, payload?)`
- mapping entries for all component mutation tools in the matrix above
- route metadata: `tab`, optional `subTab`, `targetKey`

The utility should support future extension to:

- inspect operation types such as `summary` vs `delete`
- distinguish storage `create_volume` vs `delete_mnt`

**Step 2: Add URL helper for second-level panel routing**

Extend `globalUtil` with a new `getSlidePanelSubTab()` parser that reads `subTab` from the current hash/query string, mirroring `getSlidePanelTab()`.

**Step 3: Keep the mapping UI-only for the MVP**

Do not block on `rainbond-copilot` or `rainbond-console` changes. The first version should work entirely from the local tool-name mapping table.

### Task 2: Make `advancedSettings` URL-addressable with `subTab`

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/advancedSettings.js:40-139`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/SlidePanel/components/components.js:506-599`

**Step 1: Initialize inner menu from URL**

Change `advancedSettings` so its initial `activeTab` comes from `globalUtil.getSlidePanelSubTab()` before falling back to the current default.

**Step 2: Push `subTab` back into the URL on menu change**

When the user switches `advancedSettings` inner menu items, update the current component route to include `subTab=<inner-key>`.

Expected route shape:

`/team/:teamName/region/:regionName/apps/:appID/overview?type=components&componentID=:componentAlias&tab=advancedSettings&subTab=port`

**Step 3: Sync inner menu when URL changes**

Ensure `advancedSettings` reacts to URL updates triggered externally by the Agent, not just user clicks.

**Step 4: Keep non-advanced tabs unchanged**

Do not change existing behavior for `overview`, `relation`, `connectionInformation`, `environmentConfiguration`, `expansion`, `log`, or third-party component tabs.

### Task 3: Extend Agent approval state so it can drive navigation

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/services/agent.js:55-84`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js:156-189`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js:347-386`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js:811-930`

**Step 1: Persist the fields needed for UI routing**

Extend pending approval normalization in both service/model layers to retain:

- `skillId`
- `targetRef`

This is required so UI refreshes or panel reopen behavior do not lose the mapping context.

**Step 2: Add Agent focus state**

Add a small slice of Agent UI state, for example:

- `focusTargetKey`
- `focusRoute`
- `focusNonce`

This should represent the current “jump and highlight” intent emitted from the approval flow.

**Step 3: Trigger focus intent on `approval_requested`**

Inside the Agent event pipeline, when a new `approval_requested` event arrives:

- resolve the MCP tool name through the local mapping table
- build the component target route using current team/region/app/component context
- store the focus intent in Agent state

**Step 4: Avoid firing for non-component or non-mutating approvals**

Ignore approvals that:

- do not map to component mutation tools
- do not have enough route context to build a stable component URL

### Task 4: Add route jump orchestration from the Agent host shell

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/RootShell.js:181-271`
- Create: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/AgentDomHighlighter.js`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/RootShell.less`

**Step 1: Watch Agent focus intent in `RootShell`**

Use the existing global Agent host shell as the place that:

- observes new focus intents
- dispatches `routerRedux.push()` if the target route differs
- triggers DOM highlight after route change settles

**Step 2: Implement a small DOM highlighter**

Create a helper/component that:

- finds `document.querySelector('[data-agent-target=\"...\"]')`
- scrolls the element into view
- applies a temporary highlight class
- removes the class after a timeout

**Step 3: Add a visible but lightweight highlight style**

Use a temporary visual treatment such as:

- red or orange border
- glow or shadow
- subtle pulse animation

Keep it obviously machine-driven, but avoid breaking layout.

**Step 4: Make it idempotent**

Repeated approvals for the same target should refresh the animation instead of stacking duplicate classes or timers.

### Task 5: Add stable `data-agent-target` anchors to component pages

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/SlidePanel/components/components.js:1270-1300`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/EnvironmentVariable/index.js:1078-1139`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/relation.js:176-264`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/port.js:640-677`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/mnt.js:601-664`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/setting.js:792-935`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/resource.js:893-1137`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/expansion.js:1294-1675`

**Step 1: Anchor the delete action**

Mark the component header delete action area with:

- `data-agent-target="component.header.delete"`

If the delete action is rendered inside the dropdown branch, anchor the dropdown trigger region as well.

**Step 2: Anchor environment cards**

Use different keys for:

- inner env card
- outer env card

Do not rely on translated title text as the selector.

**Step 3: Anchor relation, port, storage, probe, resource, and scale cards**

Add explicit `data-agent-target` attributes to the relevant `Card` roots, not to nested text spans.

This gives the highlighter a stable box model target and avoids brittle selectors inside Ant Design tables.

**Step 4: Keep anchors semantic**

Do not generate dynamic random IDs. The target keys should be deterministic and versionable.

### Task 6: Build the MVP verification path

**Files:**
- Modify: none

**Step 1: Build check**

Run: `yarn build`

Expected: production build succeeds without route or Agent-state regressions.

**Step 2: Manual verification scenario A**

Simulate an Agent approval for:

- `rainbond_delete_component`

Expected:

- component page opens on `tab=overview`
- delete action area is scrolled into view
- delete action area receives the temporary highlight

**Step 3: Manual verification scenario B**

Simulate an Agent approval for:

- `rainbond_manage_component_ports`

Expected:

- component page opens on `tab=advancedSettings&subTab=port`
- port card is visible and highlighted

**Step 4: Manual verification scenario C**

Simulate an Agent approval for:

- `rainbond_change_component_image`

Expected:

- component page opens on `tab=advancedSettings&subTab=resource`
- build source card is visible and highlighted

### Task 7: Add `rainbond-copilot` protocol support after the MVP works

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-copilot/src/server/services/copilot-approval-service.ts:71-145`
- Modify: `/Users/guox/Desktop/newagent/rainbond-copilot/src/server/runtime/server-llm-executor.ts:547-612`
- Modify: `/Users/guox/Desktop/newagent/rainbond-copilot/src/shared/contracts.ts`

**Step 1: Introduce optional `ui_hint` in approval/trace events**

Attach a normalized structure such as:

- `route_kind`
- `tab`
- `sub_tab`
- `target_key`

**Step 2: Prefer server-provided hints over local mapping**

Update `rainbond-ui` Agent mapping resolution so:

- use `event.data.ui_hint` first if present
- otherwise fall back to the local mapping table

**Step 3: Preserve backward compatibility**

Do not make the UI depend on `ui_hint` being present. MVP behavior must still work without server support.

### Task 8: Optional long-term convergence in `rainbond-console`

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-console/console/services/mcp_query_service.py:4547-6299`

**Step 1: Add `annotations.ui_target` to component mutation MCP tool definitions**

For example:

- `route_tab`
- `route_sub_tab`
- `ui_target_key`

**Step 2: Keep console metadata descriptive**

`rainbond-console` should define what the canonical UI surface is, but not hardcode browser URLs tied to hash-mode details.

**Step 3: Let `rainbond-copilot` translate annotations into event `ui_hint`**

This keeps `rainbond-console` as the source of truth for tool-to-UI meaning while leaving route assembly to the app-side runtime.

---

## MVP Acceptance Criteria

- The Agent can navigate to the correct component page for at least `delete`, `ports`, and `change image`.
- `advancedSettings` supports stable deep-linking via `subTab`.
- UI highlighting uses stable `data-agent-target` anchors instead of translated text selectors.
- Refreshing the page does not erase pending approval `skillId` and `targetRef`.
- The feature works without any `rainbond-console` or `rainbond-copilot` changes.

## Recommended Execution Order

1. `rainbond-ui`: local mapping + `subTab` + DOM highlighter + target anchors
2. `rainbond-copilot`: emit `ui_hint`
3. `rainbond-console`: optional MCP annotations for long-term consistency

## Minimal Verification Recommendation

If you only validate one end-to-end path first, use:

1. `rainbond_manage_component_ports`
2. `rainbond_delete_component`

This pair covers:

- nested routing
- header action targeting
- card targeting
- Agent approval state persistence

