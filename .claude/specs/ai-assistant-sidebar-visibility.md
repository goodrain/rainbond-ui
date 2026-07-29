# AI Assistant Sidebar Visibility Specification

## Commit 1

`fix: hide ai assistant config until plugin installed`

### Task 1.1

Update `src/common/enterpriseMenu.js` so the `ai` menu group is generated only when:

- the current user is an enterprise administrator;
- the `show_ai_assistant` customization is enabled;
- `PluginUtil.getPluginInfo(pluginList, 'rainbond-agent')` returns at least one installed plugin region.

Reuse the resolved plugin mapping when building the route. This preserves base-ID matching for `rainbond-agent`, `rainbond-agent-ARM64`, and `rainbond-agent-AMD64`, and routes to the first region where the plugin is actually installed.

Verification:

```bash
node src/utils/pluginArchUtils.node.test.js
source ~/.nvm/nvm.sh && nvm use 20.20.2 >/dev/null && yarn build
```
