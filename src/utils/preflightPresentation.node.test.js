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
    summary: '部分部署前检测未完成',
    checks: [
      { status: 'warning', message: '镜像仓库检测超时' },
      { status: 'warning', message: '镜像仓库检测超时' },
      { status: 'pass', message: '资源满足要求' }
    ]
  }),
  {
    summary: '部分部署前检测未完成',
    messages: ['镜像仓库检测超时']
  },
  'preflight display should keep distinct warning/block messages and remove duplicates'
);

assert.deepStrictEqual(
  getPreflightDisplay({
    summary: '部分安装环境检测未完成，安装可继续',
    checks: [
      { status: 'warning', message: '部分镜像版本检测未完成，安装将继续' }
    ]
  }, { copyType: 'deploy' }),
  {
    summary: '',
    messages: ['部分镜像版本检测未完成，部署将继续']
  },
  'deploy preflight should use deployment wording and avoid showing generic warning summary with a detailed image warning'
);

console.log('preflight presentation tests passed');
