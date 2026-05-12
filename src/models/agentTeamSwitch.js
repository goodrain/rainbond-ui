// Pure helper for the team-switch reset decision used by agent.syncContext.
//
// Backend sessions are persisted per (tenant, user). A session created
// while the user was on team A is invisible to a request that resolves
// the actor to team B; holding the old conversationId across that
// transition surfaces as "Session not found" on the next sendMessage.
//
// Returning true tells the saga to drop the local session anchor so the
// next sendMessage falls through ensureSession and lets the backend's
// idempotent createSession produce or fetch the right session for the
// new team.
//
// The first context sync after hydration (previousTeam is empty) is
// deliberately NOT treated as a switch — it is the initial population,
// not a transition. Likewise, when there is no live conversation yet
// (conversationId is the 'global-default' sentinel or missing), nothing
// needs resetting.
function shouldResetOnTeamSwitch({
  previousContext,
  nextContext,
  conversationId,
} = {}) {
  const previousTeam = (previousContext || {}).teamName || '';
  const nextTeam = (nextContext || {}).teamName || '';
  if (!previousTeam) {
    return false;
  }
  if (previousTeam === nextTeam) {
    return false;
  }
  if (!conversationId || conversationId === 'global-default') {
    return false;
  }
  return true;
}

module.exports = {
  shouldResetOnTeamSwitch,
};
