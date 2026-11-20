const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const { deliveryTargetPath, deliveryTargetIsCached } = require('./deliveryNavigation');
const task = { id: 'my-task', kind: 'delivery', status: 'running', target: { team_name: 'production', region_name: 'cluster-b', app_id: '88', app_name: 'Installed App' } };
const destinationUser = { user_id: 'user-a', teams: [{ team_name: 'production', region: [{ team_region_name: 'cluster-b' }] }] };

function controller(file, user = destinationUser) {
  const source = fs.readFileSync(`${__dirname}/${file}`, 'utf8');
  const declaration = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'decorators-legacy'] })
    .program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const method = declaration.body.body.find(node => node.key && node.key.name === 'followDelivery');
  const Target = vm.runInNewContext(`class Target { ${source.slice(method.start, method.end)} }; Target`, {
    deliveryTargetPath, deliveryTargetIsCached, routerRedux: { push: path => ({ type: 'navigate', path }) }
  });
  const target = new Target(), actions = [];
  target.generation = 0;
  target.alive = true;
  target.active = generation => target.alive && generation === target.generation;
  target.props = { user, dispatch: action => actions.push(action) };
  return { target, actions };
}

test('navigation uses the actual target team, region and newly created app ID', () => {
  assert.equal(deliveryTargetPath(task), '/team/production/region/cluster-b/apps/88/overview');
  assert.equal(deliveryTargetPath({ ...task, target: { team_name: 'team / name', region_name: 'region#1', app_id: 9 } }),
    '/team/team%20%2F%20name/region/region%231/apps/9/overview');
});

test('queued tasks, failed delivery, offline exports, tests and missing application identity do not navigate', () => {
  for (const invalid of [null, { ...task, status: 'queued' }, { ...task, status: 'failed' }, { ...task, kind: 'offline' },
    { ...task, kind: 'test' }, { ...task, target: { ...task.target, app_id: '' } }, { ...task, target: { app_id: '1' } }]) {
    assert.equal(deliveryTargetPath(invalid), '');
  }
  assert.equal(deliveryTargetPath({ ...task, status: 'succeeded' }), '/team/production/region/cluster-b/apps/88/overview');
});

for (const file of ['../pages/Group/Delivery/Records.js', '../pages/EnterpriseDelivery/Detail.js']) {
  test(`${file}: only the currently submitted task redirects, exactly once`, () => {
    const { target, actions } = controller(file);
    target.pendingDeliveryTaskId = '';
    assert.equal(target.followDelivery([task]), false);
    target.pendingDeliveryTaskId = 'my-task';
    assert.equal(target.followDelivery([{ ...task, id: 'historical-task' }]), false);
    assert.equal(target.followDelivery([{ ...task, status: 'queued', target: { app_name: 'Waiting' } }]), false);
    assert.equal(target.followDelivery([task]), true);
    assert.equal(actions[0].path, '/team/production/region/cluster-b/apps/88/overview');
    assert.equal(target.pendingDeliveryTaskId, '');
    assert.equal(target.followDelivery([task]), false);
    assert.equal(actions.length, 1);
    target.pendingDeliveryTaskId = 'my-task';
    assert.equal(target.followDelivery([{ ...task, status: 'failed' }]), false);
    assert.equal(target.pendingDeliveryTaskId, '');
    assert.equal(target.followDelivery([task]), false);
    assert.equal(actions.length, 1);
  });

  test(`${file}: an uncached target team is refreshed before navigation and polling does not duplicate the refresh`, () => {
    const { target, actions } = controller(file, { user_id: 'user-a', teams: [] });
    target.pendingDeliveryTaskId = task.id;
    assert.equal(target.followDelivery([task]), true);
    assert.equal(actions[0].type, 'user/fetchCurrent');
    assert.equal(actions[0].payload.team_name, 'production');
    target.followDelivery([task]);
    assert.equal(actions.length, 1);
    target.props.user = destinationUser;
    actions[0].callback({ bean: destinationUser });
    assert.equal(actions[1].path, deliveryTargetPath(task));
    assert.equal(target.pendingDeliveryTaskId, '');
    actions[0].callback({ bean: destinationUser });
    assert.equal(actions.length, 2);
  });

  test(`${file}: refreshed user data must include the target region before entering TeamLayout`, () => {
    const stale = { user_id: 'user-a', teams: [{ team_name: 'production', region: [{ team_region_name: 'cluster-a' }] }] };
    const { target, actions } = controller(file, stale);
    target.pendingDeliveryTaskId = task.id;
    target.followDelivery([task]);
    assert.equal(actions[0].type, 'user/fetchCurrent');
    actions[0].callback({ bean: stale });
    assert.equal(actions.length, 1);
    assert.equal(target.pendingDeliveryTaskId, '');
  });

  test(`${file}: a failed scope refresh can retry and a stale callback cannot redirect a new task`, () => {
    const { target, actions } = controller(file, { user_id: 'user-a', teams: [] });
    target.pendingDeliveryTaskId = task.id;
    target.followDelivery([task]);
    actions[0].handleError();
    target.followDelivery([task]);
    assert.equal(actions.length, 2);
    target.pendingDeliveryTaskId = 'new-task';
    actions[1].callback({ bean: destinationUser });
    assert.equal(actions.length, 2);
    assert.equal(target.pendingDeliveryTaskId, 'new-task');
  });

  test(`${file}: leaving the delivery page invalidates an outstanding target-scope refresh`, () => {
    const { target, actions } = controller(file, { user_id: 'user-a', teams: [] });
    target.pendingDeliveryTaskId = task.id;
    target.followDelivery([task]);
    target.generation += 1;
    actions[0].callback({ bean: destinationUser });
    assert.equal(actions.length, 1);
  });
}
