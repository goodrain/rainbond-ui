# App Version Delete History Spec

- Design doc: `/Users/zhangqihang/MyWork/workrc/rainbond-ui/docs/plans/2026-03-24-app-version-delete-design.md`
- Scope: `rainbond-console`, `rainbond-ui`
- Goal: let workspace app version timelines delete historical snapshots while preventing current snapshot deletion.

Execution order:

1. `rainbond-console`
2. `rainbond-ui`

Verification gates:

- `rainbond-console`: `python -m py_compile console/views/app_version.py console/services/app_version_service.py`, `make check`
- `rainbond-ui`: `yarn build`
