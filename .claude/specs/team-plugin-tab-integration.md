# Team Plugin Tab Integration Spec

- Design doc: `/Users/guox/Desktop/Project/6.28/rainbond-ui/docs/plans/2026-03-25-team-plugin-tab-integration-design.md`
- Scope: `rainbond-ui`
- Goal: move the plugin home list into the Team settings tabs, retire the standalone `/myplugns` home route, and keep plugin detail plus create/install routes independent.

Execution order:

1. Extract reusable plugin home content
2. Integrate Team page plugin tab and query routing
3. Redirect legacy `/myplugns` home route
4. Unify create and install success navigation

Verification gates:

- `rainbond-ui`: `yarn build`
