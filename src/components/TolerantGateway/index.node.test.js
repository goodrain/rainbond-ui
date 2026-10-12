const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /import \{ formatMessage \} from '@\/utils\/intl';/,
  'TolerantGateway should import the formatter used by tab labels'
);
for (const component of ['GatewayRoute', 'GatewayService', 'GatewayCertificate']) {
  assert.match(
    source,
    new RegExp(`import ${component} from`),
    `TolerantGateway should import ${component}`
  );
}
assert.match(
  source,
  /const \{[\s\S]*?routePermission,[\s\S]*?argetServicesPermission,[\s\S]*?certificatePermission[\s\S]*?\} = this\.state/,
  'TolerantGateway should render the permission objects stored in state'
);
assert.match(
  source,
  /componentDidUpdate\(prevProps\)[\s\S]*?prevProps\.currentTeamPermissionsInfo !== this\.props\.currentTeamPermissionsInfo[\s\S]*?this\.syncPermissions\(\)/,
  'TolerantGateway should resync permissions when DVA loads them asynchronously'
);
assert.match(
  source,
  /callback = key => \{[\s\S]*?this\.setState\(\{ tabKeys: key \}\)/,
  'TolerantGateway tabs should update the active key'
);

console.log('tolerant gateway permission tests passed');
