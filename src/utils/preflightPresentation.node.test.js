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

assert.deepStrictEqual(
  getPreflightDisplay({
    summary: '集群资源不足',
    checks: [
      {
        name: 'resource_capacity',
        status: 'block',
        reason: 'resource_not_enough',
        message: 'CPU和内存不足',
        details: {
          required_cpu: 2000,
          free_cpu: 1500,
          missing_cpu: 500,
          required_memory: 4096,
          free_memory: 3072,
          missing_memory: 1024
        }
      }
    ]
  }),
  {
    summary: '集群资源不足',
    messages: ['CPU和内存不足'],
    resourceDetails: [
      'CPU：需要 2000m，可用 1500m，缺少 500m',
      '内存：需要 4096Mi，可用 3072Mi，缺少 1024Mi'
    ]
  },
  'resource shortage block should expose exact CPU and memory detail lines'
);

assert.deepStrictEqual(
  getPreflightDisplay({
    checks: [
      {
        name: 'resource_capacity',
        status: 'block',
        reason: 'resource_not_enough',
        details: {
          required_cpu: 0,
          free_cpu: 0,
          missing_cpu: 0,
          required_memory: 1024,
          free_memory: null,
          missing_memory: 1024
        }
      }
    ]
  }),
  {
    summary: '',
    messages: [],
    resourceDetails: ['CPU：需要 0m，可用 0m，缺少 0m']
  },
  'resource details should accept explicit zeroes and omit incomplete numeric groups'
);

assert.deepStrictEqual(
  getPreflightDisplay({
    summary: '安装环境检测通过',
    checks: [
      {
        name: 'resource_capacity',
        status: 'pass',
        reason: '',
        message: '集群资源满足安装要求',
        details: {
          required_cpu: 2000,
          free_cpu: 3000,
          missing_cpu: 0,
          required_memory: 4096,
          free_memory: 8192,
          missing_memory: 0
        }
      }
    ]
  }),
  {
    summary: '安装环境检测通过',
    messages: []
  },
  'passing resource checks should preserve the existing display shape exactly'
);

console.log('preflight presentation tests passed');
