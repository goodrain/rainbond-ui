const assert = require('assert');
const { getPreflightDisplay } = require('./preflightPresentation');

assert.deepStrictEqual(
  getPreflightDisplay({
    summary: '仓库地址格式不正确',
    checks: [
      { status: 'block', message: '仓库地址格式不正确' }
    ]
  }),
  {
    summary: '仓库地址格式不正确',
    messages: []
  },
  'preflight display should not repeat a check message that is identical to the summary'
);

assert.deepStrictEqual(
  getPreflightDisplay({
    summary: '部分部署前检测无法确认',
    checks: [
      { status: 'warning', message: '镜像仓库检测超时' },
      { status: 'warning', message: '镜像仓库检测超时' },
      { status: 'pass', message: '资源满足要求' }
    ]
  }),
  {
    summary: '',
    messages: ['镜像仓库检测超时']
  },
  'preflight display should keep distinct warning/block messages and remove duplicates'
);

assert.deepStrictEqual(
  getPreflightDisplay({
    summary: '部分安装前检测无法确认',
    checks: [
      { status: 'warning', message: '部分镜像版本检测无法确认' }
    ]
  }, { copyType: 'deploy' }),
  {
    summary: '',
    messages: ['部分镜像版本检测无法确认']
  },
  'deploy preflight should avoid showing generic warning summary with a detailed image warning'
);

console.log('preflight presentation tests passed');
