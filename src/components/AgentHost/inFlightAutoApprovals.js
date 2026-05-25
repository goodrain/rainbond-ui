// Module-level dedup set for in-flight auto-approval dispatches.
//
// Concurrent SSE streams can deliver the same `approval.requested` event
// twice (or two saga instances can race the prevApprovalId guard before
// either marks the approval as auto-approved). This helper provides a
// synchronous claim/release primitive so only one auto-approval dispatch
// is allowed per approvalId at any given moment.
//
// Set.add() / Set.has() are synchronous, so even if two saga instances
// reach claim() in the same JS turn, exactly one will see has()===false
// and "win" the claim. release() must be called once the resolveApproval
// saga finishes (success or error) so retries remain possible.

const claimed = new Set();

function claim(id) {
  if (!id) {
    return false;
  }
  if (claimed.has(id)) {
    return false;
  }
  claimed.add(id);
  return true;
}

function release(id) {
  if (!id) {
    return;
  }
  claimed.delete(id);
}

function _reset() {
  claimed.clear();
}

module.exports = { claim, release, _reset };
