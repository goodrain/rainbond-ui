// Shared with the Node checks so replay and live trace normalization cannot drift.
import traceHelpers from './agentTraceHelpers.node';

export const {
  extractWebSources,
  applyTraceEvent,
  buildTraceContent,
  findTraceMessageIndex,
  sanitizeToolValue,
  detailText
} = traceHelpers;
