# Deploy Preflight Application Context Spec

- Design: `rainbond-console/docs/plans/2026-07-28-deploy-preflight-permission-scope-design.md`
- Repository: `rainbond-ui`
- Commit: `fix: send deploy preflight application context`

## Required Behavior

1. Promote `group_id` to the request top level for existing applications.
2. Prefer an explicitly supplied top-level value over the nested compatibility value.
3. Preserve the original nested payload.
4. Omit `group_id` for a new application.
5. Keep the endpoint path and DVA response flow unchanged.

## Verification

Run both deploy-preflight Node tests and the mandatory `yarn build` quality gate.
