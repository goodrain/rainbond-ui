const READY_BACKUP_REPO_PHASE = 'Ready';
const CHECKING_BACKUP_REPO_PHASES = ['', 'PreChecking', 'Checking', 'Creating'];

function getBackupRepoPhase(repo) {
  return (repo && (repo.phase || repo.status)) || '';
}

function isBackupRepoSelectable(repo) {
  return getBackupRepoPhase(repo) === READY_BACKUP_REPO_PHASE;
}

function shouldAutoSelectCreatedBackupRepo(repo) {
  return Boolean(repo && repo.name && isBackupRepoSelectable(repo));
}

function getBackupRepoPhaseTextId(phase) {
  if (phase === READY_BACKUP_REPO_PHASE) {
    return 'kubeblocks.database.backup.repo.phase.available';
  }
  if (phase === 'Missing') {
    return 'kubeblocks.database.backup.repo.phase.unavailable';
  }
  if (phase === 'Failed') {
    return 'kubeblocks.database.backup.repo.phase.failed';
  }
  if (phase === 'Deleting') {
    return 'kubeblocks.database.backup.repo.phase.deleting';
  }
  if (CHECKING_BACKUP_REPO_PHASES.includes(phase)) {
    return 'kubeblocks.database.backup.repo.phase.checking';
  }
  return '';
}

function getBackupRepoOptions(backupRepos = []) {
  return backupRepos || [];
}

function validateBackupRepoSelection(repoName, backupRepos = []) {
  if (!repoName) {
    return true;
  }
  const repo = (backupRepos || []).find(item => item.name === repoName);
  return Boolean(repo && isBackupRepoSelectable(repo));
}

module.exports = {
  READY_BACKUP_REPO_PHASE,
  getBackupRepoOptions,
  getBackupRepoPhase,
  getBackupRepoPhaseTextId,
  isBackupRepoSelectable,
  shouldAutoSelectCreatedBackupRepo,
  validateBackupRepoSelection
};
