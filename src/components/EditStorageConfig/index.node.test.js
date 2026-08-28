const assert = require('assert');
const fs = require('fs');
const path = require('path');

const componentSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const pluginManageSource = fs.readFileSync(
  path.join(__dirname, '../../pages/Plugin/manage.js'),
  'utf8'
);
const componentPluginSource = fs.readFileSync(
  path.join(__dirname, '../../pages/Component/plugin.js'),
  'utf8'
);

assert.ok(
  componentSource.includes('loading={!!this.props.loading}') &&
    !componentSource.includes('this.setState({ loading: true })') &&
    !componentSource.includes('loading: false'),
  'the submit button should follow DVA request loading and recover after failures'
);

assert.ok(
  componentSource.includes('validatePluginStorageName') &&
    componentSource.includes('hasDuplicateStorageName') &&
    componentSource.includes('hasDuplicateStoragePath'),
  'the form should validate Kubernetes names and duplicate storage fields'
);

assert.ok(
  pluginManageSource.includes(
    'loading={isEditor ? editConfigLoading : addConfigLoading}'
  ) && pluginManageSource.includes('storageList={storgeListData}'),
  'plugin management should pass request loading and existing storage to the editor'
);

assert.ok(
  componentPluginSource.includes(
    "editStorageLoading: loading.effects['appControl/editPluginConfigs']"
  ) &&
    componentPluginSource.includes('loading={editStorageLoading}') &&
    componentPluginSource.includes('storageList={storageList}'),
  'installed plugin storage editing should pass request loading and existing storage'
);

console.log('storage config component tests passed');
