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
yarn build              # Production build
```

## Coding Conventions

- Use Ant Design 3.x components (NOT v4/v5 — no hooks-based antd API)
- Use class components with `@connect` decorator (DVA pattern)
- Use DVA for state management (not raw Redux)
- API calls go through service functions, never directly in components
- i18n: add translations in both `zh-CN` and `en-US` locale files
- Route config in `config/router.config.js`
- Commit messages in English, Conventional Commits format
