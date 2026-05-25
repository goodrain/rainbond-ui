# Agent Mutation Route Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the Agent is about to execute a delete/create/update action, `rainbond-ui` should jump to the relevant page before execution, and after execution it should navigate to the correct destination and refresh the corresponding table or page data so the user can immediately see the result.

**Architecture:** Keep the entire solution inside `rainbond-ui`. Build a local mapping from Rainbond MCP tool names to UI routes, tab/sub-tab state, and refresh behavior. Reuse the existing Agent approval/event flow to detect both “about to operate” and “operation completed” moments, then drive routing and remount-based data refresh from the frontend only. Do not modify `rainbond-copilot` or `rainbond-console` in this phase.

**Tech Stack:** React 16.8 class components, DVA 2.4, Umi 3.5, Ant Design 3.19, Less, Rainbond console REST APIs, Rainbond Copilot SSE approval and trace events.

---

## Scope

This plan is intentionally **frontend-only**.

Out of scope for this version:

- `rainbond-copilot` protocol changes
- `rainbond-console` MCP definition changes
- global highlighter overlays
- DOM anchor systems such as `data-agent-target`

This version only guarantees:

1. pre-action route jump
2. post-action route correction
3. target page or table refresh

## Core UX Rules

### Before execution

When the Agent receives a component/app mutation approval request:

- jump to the relevant route immediately
- switch the correct component tab
- if needed, switch the correct `advancedSettings` sub-tab

### After execution

When the action completes successfully:

- refresh the affected page or table data
- if the resource no longer exists or a new resource was created, navigate to the correct destination

### Required navigation rules

- deleting a component: return to the current app home page
- deleting an app: return to the team home page
- creating an app: enter the new app home page
- creating a component: enter the new component home page
- batch create: default to the first created result

If the result payload contains multiple created services or apps, the first one should be used as the default landing target unless a clearer primary resource can be inferred.

## Route Policy Matrix

Use this as the local frontend source of truth.

| Tool | Pre-action route | Post-success route | Refresh target |
|---|---|---|---|
| `rainbond_delete_component` | current component `tab=overview` | current app overview | app overview page |
| `rainbond_delete_app` | current app overview | current team home | team home page |
| `rainbond_manage_component_envs` | component `tab=environmentConfiguration` | stay on same route | env table |
| `rainbond_manage_component_connection_envs` | component `tab=connectionInformation` | stay on same route | connection env table |
| `rainbond_manage_component_dependency` | component `tab=relation` | stay on same route | relation table |
| `rainbond_manage_component_ports` | component `tab=advancedSettings&subTab=port` for normal components, `tab=port` for third-party components | stay on same route | port table/list |
| `rainbond_manage_component_storage` | component `tab=advancedSettings&subTab=mnt` | stay on same route | volume/mount tables |
| `rainbond_manage_component_probe` | component `tab=advancedSettings&subTab=setting` | stay on same route | health check cards |
| `rainbond_manage_component_autoscaler` | component `tab=expansion` | stay on same route | autoscaler rules/records |
| `rainbond_horizontal_scale_component` | component `tab=expansion` | stay on same route | scaling page |
| `rainbond_vertical_scale_component` | component `tab=expansion` | stay on same route | scaling page |
| `rainbond_change_component_image` | component `tab=advancedSettings&subTab=resource` | stay on same route | build source card/page |
| `rainbond_create_app` | current team/app context page | new app overview | new app page |
| `rainbond_create_app_from_yaml` | current team/app context page | new app overview | new app page |
| `rainbond_create_app_from_snapshot_version` | current team/app context page | new app overview | new app page |
| `rainbond_create_component` | current app overview | new component overview | new component page |
| `rainbond_create_component_from_image` | current app overview | new component overview | new component page |
| `rainbond_create_component_from_source` | current app overview | new component overview | new component page |
| `rainbond_create_component_from_package` | current app overview | new component overview | new component page |
| `rainbond_create_component_from_local_package` | current app overview | new component overview | new component page |

Important constraint:

- `advancedSettings` inner menu state is currently local state only. This plan must add `subTab` URL support before pre-action route jumps can reliably land on `port`, `mnt`, `resource`, or `setting`.

---

### Task 1: Create a pure-frontend mutation route policy layer

**Files:**
- Create: `/Users/guox/Desktop/newagent/rainbond-ui/src/utils/agentMutationRouteMap.js`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/utils/global.js:240-272`

**Step 1: Create the mapping module**

Add a utility that exports:

- `getAgentMutationRoutePolicy(toolName, payload?)`
- `resolvePreActionRoute(policy, context, payload?)`
- `resolvePostActionRoute(policy, context, resultPayload?)`

The mapping should include:

- target route tab
- optional `subTab`
- refresh mode
- post-success destination strategy

**Step 2: Add URL helpers for extra query state**

Extend `globalUtil` with:

- `getSlidePanelSubTab()`
- `getSlidePanelRefreshKey()`

These should mirror the existing query parsing style used by `componentID`, `type`, and `tab`.

**Step 3: Keep the policy local**

Do not fetch route hints from any backend source in this version.

### Task 2: Make `advancedSettings` deep-linkable with `subTab`

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/advancedSettings.js:40-139`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/SlidePanel/components/components.js:506-599`

**Step 1: Read `subTab` on initial render**

Initialize `advancedSettings` from `globalUtil.getSlidePanelSubTab()` before using the current default tab.

**Step 2: Push `subTab` into the URL**

When the inner menu changes, write:

- `tab=advancedSettings`
- `subTab=<inner-key>`

back into the route.

**Step 3: React to URL changes**

If the Agent changes the route externally, `advancedSettings` must update its inner menu state instead of staying stale.

**Step 4: Preserve current non-advanced behavior**

Do not change the routing behavior of:

- `overview`
- `log`
- `relation`
- `environmentConfiguration`
- `connectionInformation`
- `expansion`
- third-party component tabs

### Task 3: Extend Agent state to track route jumps and mutation completion

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/services/agent.js:55-84`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js:156-189`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js:242-430`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js:811-930`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agentTraceHelpers.js:45-94`

**Step 1: Preserve approval metadata**

Keep these fields in persisted approval state:

- `skillId`
- `targetRef`

This ensures refreshes and panel reopen flows still know which route policy to use.

**Step 2: Add mutation navigation state**

Add Agent UI state for:

- `pendingMutationRoute`
- `pendingMutationRefreshKey`
- `pendingMutationTool`
- `lastMutationResult`
- `lastMutationRunId`

**Step 3: Trigger pre-action route jump on `approval_requested`**

When a new mutation approval arrives:

- resolve the route policy from the tool name
- build the target component/app route
- store the pre-action navigation intent

**Step 4: Capture mutation results from trace output**

Use `chat.trace` events to retain the structured result of mutable tools. The frontend already receives the raw trace payload; extend the reducer path so it can extract tool output and associate it with the current run.

This is needed for:

- app create success
- component create success
- delete success navigation

**Step 5: Detect run completion**

When the current mutation run reaches a terminal successful state, resolve the post-success route and refresh behavior using:

- current context
- mutation tool name
- last mutable tool output payload

### Task 4: Add frontend-only jump and refresh orchestration in `RootShell`

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/RootShell.js:181-271`

**Step 1: Watch Agent mutation navigation state**

Use `RootShell` as the place that:

- observes pending mutation route state
- dispatches `routerRedux.push()` when the target route differs
- avoids duplicate pushes for the same route key

**Step 2: Introduce a refresh query strategy**

When the target route is already the current route, append or replace a `refresh=<timestamp>` query parameter so the relevant page can detect a fresh Agent-triggered update cycle.

**Step 3: Distinguish pre-action and post-success navigation**

Pre-action:

- jump to the target route without leaving the current resource

Post-success:

- if the resource still exists, stay on route and bump `refresh`
- if the resource was deleted, route to parent destination
- if a new resource was created, route to that new resource page

### Task 5: Standardize remount-based refresh for component tabs

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/SlidePanel/components/components.js:1718-1884`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/advancedSettings.js:53-139`

**Step 1: Thread refresh state into tab rendering**

Use the route `refresh` query as part of the rendered tab key so a route-level refresh forces the relevant component tab to remount.

Examples:

- component tab key: `${activeTab}-${refreshKey}`
- advancedSettings child key: `${activeSubTab}-${refreshKey}`

**Step 2: Let remount trigger existing `componentDidMount` fetches**

Many component pages already fetch data in `componentDidMount`. Prefer remount-driven refresh over building a large custom event bus.

**Step 3: Keep tab-local state safe**

Only use this remount pattern for Agent-triggered mutation refreshes. Normal browsing should not lose local state on ordinary tab switches.

### Task 6: Add route-aware refresh handling for the main mutation pages

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/environmentConfiguration.js`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/EnvironmentVariable/index.js:705-1139`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/relation.js:51-277`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/port.js:286-742`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/mnt.js:142-704`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/setting.js:160-1068`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/resource.js:327-1398`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Component/expansion.js:262-1793`

**Step 1: Validate refresh-by-remount coverage**

Confirm each target page reloads the needed data when remounted:

- env pages: `fetchInnerEnvs` / outer env list path
- relation: `loadRelationedApp`
- port: `fetchPorts`
- storage: `fetchVolumes`, `loadMntList`, `fetchVolumeOpts`
- probe/settings: `fetchStartProbe`, `fetchRunningProbe`, `fetchPorts`, `fetchBaseInfo`
- resource/build source: `loadBuildSourceInfo`, `getRuntimeInfo`
- expansion: `getScalingRules`, `getScalingRecord`, `fetchInstanceInfo`, `fetchExtendInfo`

**Step 2: Add explicit fallback refresh hooks only where remount is insufficient**

If any target page is not reliably refreshed by remount alone, add a `componentDidUpdate` check on the route refresh key and call the same local fetch methods again.

**Step 3: Keep refresh localized**

Do not introduce a global application-wide refresh event. Each page should refresh only the data it already owns.

### Task 7: Implement post-success navigation rules for create/delete flows

**Files:**
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/utils/agentMutationRouteMap.js`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js`
- Modify: `/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/RootShell.js`

**Step 1: Delete success rules**

Implement:

- `rainbond_delete_component` -> `/team/:teamName/region/:regionName/apps/:appID/overview`
- `rainbond_delete_app` -> team home route

The exact team home route should reuse the app’s existing navigation conventions in `rainbond-ui`, not introduce a new route shape.

**Step 2: Create success rules**

Implement:

- `rainbond_create_app*` -> new app overview route using returned `app_id`
- `rainbond_create_component*` -> new component route using returned `service_alias` if available, otherwise another frontend-usable alias field from the tool output

**Step 3: Batch create defaulting**

If a create result returns multiple resources:

- choose the first created resource as the landing target

**Step 4: Guard against incomplete outputs**

If the result payload is missing route-critical fields:

- stay on the current route
- trigger a `refresh`
- avoid navigating to a broken URL

### Task 8: Minimal verification path

**Files:**
- Modify: none

**Step 1: Build check**

Run: `yarn build`

Expected: no new compile errors in Agent, component routing, or component page remount logic.

**Step 2: Manual verification A: delete component**

Simulate an Agent approval for:

- `rainbond_delete_component`

Expected:

- before execution: jump to current component `tab=overview`
- after success: return to current app overview

**Step 3: Manual verification B: mutate ports**

Simulate:

- `rainbond_manage_component_ports`

Expected:

- before execution: jump to `tab=advancedSettings&subTab=port` or `tab=port` for third-party components
- after success: remain on the same page and refresh the ports list

**Step 4: Manual verification C: change component image**

Simulate:

- `rainbond_change_component_image`

Expected:

- before execution: jump to `tab=advancedSettings&subTab=resource`
- after success: remain on the same page and refresh build source/runtime info

**Step 5: Manual verification D: create component**

Simulate:

- `rainbond_create_component_from_image`

Expected:

- after success: route to the new component overview page

**Step 6: Manual verification E: delete app**

Simulate:

- `rainbond_delete_app`

Expected:

- after success: route back to team home

---

## MVP Acceptance Criteria

- The feature is implemented entirely in `rainbond-ui`.
- `advancedSettings` supports stable `subTab` deep links.
- Agent approvals can trigger pre-action route jumps without server-side route hints.
- Mutation completion can trigger either route refresh or destination correction.
- Delete and create flows follow the required route fallback rules.
- At least ports, component deletion, component creation, and build-source update are manually verified.

## Recommended Implementation Order

1. local route policy map
2. `subTab` URL support
3. Agent mutation state + trace result capture
4. `RootShell` jump and refresh orchestration
5. component tab remount refresh
6. post-success create/delete route rules
