const assert = require('assert');
const { createSessionPersistenceScheduler } = require('./sessionPersistenceScheduler');

async function wait(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const calls = [];
  const scheduler = createSessionPersistenceScheduler({
    delayMs: 20,
    persistFn(snapshot, userId) {
      calls.push({ snapshot, userId });
    }
  });

  scheduler.schedule({ updatedAt: 1 }, 'u_1');
  scheduler.schedule({ updatedAt: 2 }, 'u_1');
  await wait(30);

  assert.deepStrictEqual(
    calls,
    [{ snapshot: { updatedAt: 2 }, userId: 'u_1' }],
    'scheduler should debounce multiple updates and persist only the latest snapshot'
  );

  scheduler.schedule({ updatedAt: 3 }, 'u_1', { immediate: true });
  assert.deepStrictEqual(
    calls[1],
    { snapshot: { updatedAt: 3 }, userId: 'u_1' },
    'scheduler should flush immediately when requested'
  );

  scheduler.schedule({ updatedAt: 4 }, 'u_1');
  scheduler.cancel();
  await wait(30);
  assert.strictEqual(calls.length, 2, 'cancel should discard pending persistence');

  console.log('session persistence scheduler tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
