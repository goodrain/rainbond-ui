const assert = require('assert');

const {
  LOG_QUERY_LIMIT,
  buildLogCountExpression,
  collectCompleteLogRange,
  parseLokiLogFrames,
  parseLogCountFrames
} = require('./logDownload');

async function run() {
  assert.strictEqual(LOG_QUERY_LIMIT, 5000);
  assert.strictEqual(
    buildLogCountExpression('{service_alias="gr123"} |= "error"', 1000, 6500),
    'sum(count_over_time({service_alias="gr123"} |= "error" [5500ms]))'
  );
  assert.strictEqual(
    parseLogCountFrames([
      {
        schema: { fields: [{ name: 'Time' }, { name: 'Value' }] },
        data: { values: [[1000], [3200]] }
      },
      {
        schema: { fields: [{ name: 'Time' }, { name: 'Value #B' }] },
        data: { values: [[1000], [1801]] }
      }
    ]),
    5001
  );

  const parsedLogs = parseLokiLogFrames([
    {
      schema: {
        fields: [{ name: 'Line' }, { name: 'labels' }, { name: 'Time' }]
      },
      data: {
        values: [
          ['first', '', 'third', '', 'fifth'],
          [{}, {}, {}, {}, {}],
          [1000, 2000, 3000, 4000, 5000]
        ]
      }
    }
  ], timestamp => `time-${timestamp}`);

  assert.strictEqual(parsedLogs.length, 5);
  assert.deepStrictEqual(
    parsedLogs.map(item => item.msg),
    ['first', '', 'third', '', 'fifth']
  );
  assert.strictEqual(parsedLogs[1].formattedTime, 'time-2000');

  const queriedRanges = [];
  const progress = [];
  const logs = await collectCompleteLogRange({
    from: 0,
    to: 10,
    limit: 2,
    fetchRange: async range => {
      queriedRanges.push([range.from, range.to]);
      if (range.from === 0 && range.to === 10) {
        return ['truncated-1', 'truncated-2'];
      }
      return range.from === 0 ? ['old'] : ['new'];
    },
    onProgress: count => progress.push(count)
  });

  assert.deepStrictEqual(queriedRanges, [[0, 10], [0, 5], [5, 10]]);
  assert.deepStrictEqual(logs, ['old', 'new']);
  assert.deepStrictEqual(progress, [1, 2]);

  const preSplitRanges = [];
  const preSplitLogs = await collectCompleteLogRange({
    from: 0,
    to: 10,
    limit: 2,
    expectedTotal: 3,
    fetchRange: async range => {
      preSplitRanges.push([range.from, range.to]);
      return [`log-${range.from}`];
    }
  });

  assert.deepStrictEqual(preSplitRanges, [[0, 3], [3, 6], [6, 10]]);
  assert.strictEqual(preSplitLogs.length, 3);

  await assert.rejects(
    collectCompleteLogRange({
      from: 0,
      to: 10,
      limit: 5,
      expectedTotal: 3,
      fetchRange: async () => ['one', 'two']
    }),
    /应有 3 条，实际获取 2 条/
  );

  await assert.rejects(
    collectCompleteLogRange({
      from: 0,
      to: 10,
      limit: 2,
      fetchRange: async range => {
        if (range.from === 0 && range.to === 10) {
          return ['truncated-1', 'truncated-2'];
        }
        throw new Error('query failed');
      }
    }),
    /query failed/
  );

  await assert.rejects(
    collectCompleteLogRange({
      from: 0,
      to: 1,
      limit: 2,
      fetchRange: async () => ['one', 'two']
    }),
    /单位时间内日志过多/
  );

  console.log('log download helper tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
