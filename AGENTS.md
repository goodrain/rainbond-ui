# Rainbond UI — React Frontend

## Overview

Rainbond UI is the web frontend for the Rainbond platform. It communicates with `rainbond-console` (Django) via HTTP REST APIs.

- Language: JavaScript (ES6+)
- Framework: React 16.8 + UMI 3.5 + DVA 2.4
- UI Library: Ant Design 3.19 (NOT v4/v5)
- State Management: DVA (redux + redux-saga)
- i18n: UMI locale plugin (zh-CN default, en-US supported)
- Build: UMI (`yarn build`)

## Key Directories

```
src/
  pages/                 — Page components (route-based)
  components/            — Reusable UI components
  models/                — DVA models (state + effects + reducers)
  services/              — API call functions
  locales/               — i18n translations (zh-CN/, en-US/)
  layouts/               — Page layout components
  utils/                 — Shared utilities (request.js, etc.)
  assets/                — Static assets
  common/                — Common constants and configs
config/
  config.js              — UMI config (routes, proxy, dva, locale)
  router.config.js       — Route definitions
  api.config.js          — API base URL config
  theme.js               — Ant Design theme overrides
routes/                  — Additional route configs
```

## Architecture: Data Flow

```
User Action → Page Component → dispatch(DVA action)
    ↓
DVA Model (effect) → Service function → HTTP request
    ↓                                       ↓
DVA Model (reducer) ← response ← rainbond-console (/console/*)
    ↓
Component re-render via connect()
```

## API Proxy Configuration

In `config/config.js`, dev proxy routes all API calls to console:
```
/console/*          → http://127.0.0.1:7070
/openapi/v1/*       → http://127.0.0.1:7070
/data/*             → http://127.0.0.1:7070
/enterprise-server/* → http://127.0.0.1:7070
/app-server/*       → http://127.0.0.1:7070
```

## Adding a New Page

1. Create page component in `src/pages/YourPage/`
2. Add route in `config/router.config.js`
3. Add DVA model in `src/models/` if state management needed
4. Add service functions in `src/services/` for API calls
5. Add i18n keys in `src/locales/zh-CN/` and `src/locales/en-US/`

## Adding a New API Call

1. Add service function in `src/services/api.js` (or relevant service file)
2. Add DVA effect in the relevant model (`src/models/`)
3. Call via `dispatch({ type: 'modelName/effectName', payload: {...} })` from component

## Code Patterns

### Service Function Pattern
```javascript
// src/services/api.js
import apiconfig from '../../config/api.config';
import request from '../utils/request';

export async function getSomething(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/something`,
    {
      method: 'get',
      params: { page: body.page, page_size: body.page_size }
    }
  );
}

export async function createSomething(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/something`,
    {
      method: 'post',
      data: { name: body.name }
    }
  );
}
```

### DVA Model Pattern
```javascript
// src/models/something.js
import { getSomething, createSomething } from '../services/api';

export default {
  namespace: 'something',
  state: { list: [], total: 0 },
  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(getSomething, payload);
      if (response) {
        yield put({ type: 'save', payload: response.data });
      }
    },
    *create({ payload, callback }, { call }) {
      const response = yield call(createSomething, payload);
      if (response && callback) callback(response);
    },
  },
  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },
};
```

### Page Component Pattern
```javascript
import React, { PureComponent } from 'react';
import { connect } from 'dva';

@connect(({ something }) => ({ list: something.list }))
class SomePage extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: 'something/fetch', payload: { team_name: 'xxx' } });
  }
  render() {
    const { list } = this.props;
    return <div>{/* Ant Design 3.x components */}</div>;
  }
}
export default SomePage;
```

## Cross-Repository Relationships

- Calls: `rainbond-console` via `/console/*` and `/openapi/v1/*` HTTP APIs
- All API calls go through `src/utils/request.js` utility
- API base URL configured in `config/api.config.js`

## Build & Verify

```bash
yarn install            # Install dependencies
yarn start              # Dev server (proxies to console at :7070)
yarn build              # Production build (MANDATORY quality gate)
```

## Quality Gates

**前端不使用 TDD，使用构建门控 + 代码审查保障质量：**

1. **`yarn build` 必须通过** — 这是最低限度的质量保障，编译不过 = 一定有问题
2. **代码审查** — 使用 `frontend-patterns` skill 检查 React 模式
3. **API 对接验证** — 确保 service 层路径与 console 暴露的 API 一致
4. **手动验证** — 涉及 UI 变更时，启动 `yarn start` 在浏览器中确认效果

## Design System（来自 `config/theme.js`）

开发新组件/页面时，**必须使用以下 Less 变量**，禁止写死颜色和字号值。

### 主题色
| 变量 | 值 | 用途 |
|------|-----|------|
| `@primary-color` | `#155aef` | 主色（按钮、链接、选中态） |
| `@success-color` | `#18B633` | 成功 |
| `@warning-color` | `#FF8D3C` | 警告 |
| `@error-color` | `#FC481B` | 错误 |

### 文字色
| 变量 | 值 | 用途 |
|------|-----|------|
| `@heading-color` / `@text-color` | `#495464` | 标题和正文 |
| `@text-color-secondary` | `#676f83` | 次要文字 |
| `@rbd-label-color` | `#8d9bad` | 标签/注释 |

### 字号层级
| 层级 | 变量 | 字号 | 行高 |
|------|------|------|------|
| 特大号 | `@rbd-display-size` | 36px | 50px |
| 大标题 | `@rbd-title-big-size` | 24px | 36px |
| 一级标题 | `@rbd-title-size` | 18px | 26px |
| 二级标题 | `@rbd-sub-title-size` | 16px | 24px |
| 正文 | `@rbd-content-size` | 14px | 22px |
| 辅助文字 | `@rbd-auxiliary-size` | 12px | 20px |

### 阴影
| 变量 | 用途 |
|------|------|
| `@rbd-min-card-shadow` | 卡片默认阴影 |
| `@rbd-card-shadow` | 卡片标准阴影 |
| `@rbd-card-shadow-hover` | 卡片悬浮阴影 |

### 状态色
| 状态 | 变量 | 颜色 |
|------|------|------|
| 运行中/成功 | `@rbd-success-status` | `#00D777` |
| 异常 | `@rbd-error-status` | `#CD0200` |
| 警告 | `@rbd-warning-status` | `#F69D4A` |
| 下线 | `@rbd-down-status` | `#708090` |
| 处理中 | `@rbd-processing-status` | `#1890ff` |

### 背景和边框
| 变量 | 值 | 用途 |
|------|-----|------|
| `@rbd-background-color` | `#f2f4f7` | 页面背景 |
| `@border-color-base` | `#E2E2E2` | 通用边框 |

## Coding Conventions

- Use Ant Design **3.x** components (NOT v4/v5 — no hooks-based antd API)
- Use **class components** with `@connect` decorator (DVA pattern, NOT function components)
- Use DVA for state management (not raw Redux or React hooks state)
- API calls go through service functions, never directly in components
- **Use Less variables** from `config/theme.js` — never hardcode colors, font sizes, or shadows
- i18n: add translations in both `zh-CN` and `en-US` locale files
- Route config in `config/router.config.js`
- Commit messages in English, Conventional Commits format
- New `.less` files should import theme variables via `@import '~antd/lib/style/themes/default.less'` if needed

