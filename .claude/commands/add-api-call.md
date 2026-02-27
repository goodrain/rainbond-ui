# 新增 API 调用

引导开发者在 rainbond-ui 中新增一个 API 调用。

## 请提供以下信息

1. Console API 路径（例如：`/console/teams/{team_name}/apps/{app_id}/something`）
2. HTTP 方法（GET/POST/PUT/DELETE）
3. 请求参数和响应格式
4. 在哪个页面/组件中使用？

## 实施步骤

### 1. 添加 Service 函数
- 文件：`src/services/api.js`（或对应的 service 文件）

```javascript
export async function getSomething(body = {}) {
  return request(
    `${apiconfig.baseUrl}/console/teams/${body.team_name}/apps/${body.app_id}/something`,
    {
      method: 'get',
      params: { page: body.page }
    }
  );
}
```

### 2. 添加 DVA Effect
- 文件：`src/models/` 下对应的 model 文件
- 在 effects 中添加：

```javascript
*fetchSomething({ payload, callback }, { call, put }) {
  const response = yield call(getSomething, payload);
  if (response) {
    yield put({ type: 'saveSomething', payload: response.data });
  }
  if (callback) callback(response);
},
```

### 3. 添加 Reducer（如需保存到 state）
```javascript
saveSomething(state, action) {
  return { ...state, something: action.payload };
},
```

### 4. 在组件中调用
```javascript
const { dispatch } = this.props;
dispatch({
  type: 'modelName/fetchSomething',
  payload: { team_name: 'xxx', app_id: 123 },
  callback: (res) => { /* 处理响应 */ }
});
```

### 5. 验证
```bash
yarn build
```
