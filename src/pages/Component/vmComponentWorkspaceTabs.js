const VM_WORKSPACE_TABS = Object.freeze([
  { key: 'overview', message: 'componentOverview.vmWorkspace.tabs.overview' },
  { key: 'expansion', message: 'componentOverview.vmWorkspace.tabs.hardware' },
  { key: 'port', message: 'componentOverview.vmWorkspace.tabs.network' },
  { key: 'snapshots', message: 'componentOverview.vmWorkspace.tabs.snapshots' },
  { key: 'advancedSettings', message: 'componentOverview.vmWorkspace.tabs.advanced' },
  { key: 'rainbond-vm', message: 'componentOverview.vmWorkspace.tabs.monitor' }
]);

const LEGACY_ADVANCED_TABS = Object.freeze(['log', 'environmentConfiguration', 'relation']);

function normalizeVmComponentWorkspaceTab(tab, subTab = '') {
  const aliases = {
    hardware: 'expansion', mnt: 'expansion', network: 'port',
    snapshot: 'snapshots', console: 'overview', advanced: 'advancedSettings', monitor: 'rainbond-vm'
  };
  if (LEGACY_ADVANCED_TABS.includes(tab)) return 'advancedSettings';
  const normalizedTab = aliases[tab] || tab || 'overview';
  if (normalizedTab === 'advancedSettings') {
    if (subTab === 'port') return 'port';
    if (subTab === 'mnt') return 'expansion';
  }
  return normalizedTab;
}

function getVmLegacyAdvancedSubTab(tab) {
  return LEGACY_ADVANCED_TABS.includes(tab) ? tab : '';
}

module.exports = { VM_WORKSPACE_TABS, LEGACY_ADVANCED_TABS, normalizeVmComponentWorkspaceTab, getVmLegacyAdvancedSubTab };
