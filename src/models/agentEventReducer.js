const {
  buildTraceContent,
} = require('./agentTraceHelpers.node');

function createAgentMessage(role, kind, content, contextSnapshot = {}, extra = {}) {
  return {
    id: `msg_${role}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    role,
    kind,
    content,
    createdAt: Date.now(),
    contextSnapshot,
    ...extra,
  };
}

function normalizePendingApproval(pendingApproval) {
  if (!pendingApproval || typeof pendingApproval !== 'object') {
    return null;
  }

  return {
    approvalId: pendingApproval.approvalId || '',
    description: pendingApproval.description || '',
    risk: pendingApproval.risk || 'medium',
    runId: pendingApproval.runId || '',
    sessionId: pendingApproval.sessionId || '',
    status: pendingApproval.status || 'pending',
    lastSequence: pendingApproval.lastSequence || 0,
  };
}

function findApprovalMessageIndex(messages, approvalId) {
  return messages.findIndex(
    item => item && item.kind === 'approval' && item.approval && item.approval.approvalId === approvalId
  );
}

function findLatestAssistantNormalMessageIndex(messages) {
  for (let index = (messages || []).length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (item && item.role === 'assistant' && item.kind === 'normal') {
      return index;
    }
  }
  return -1;
}

function applyAgentEvent(state, payload = {}) {
  const event = payload.event;
  const contextSnapshot = payload.contextSnapshot || {};
  const baseMessages = Array.isArray(state.messages) ? state.messages : [];
  let nextMessages = baseMessages;
  let messagesCloned = false;
  const ensureMutableMessages = () => {
    if (!messagesCloned) {
      nextMessages = baseMessages.slice();
      messagesCloned = true;
    }
    return nextMessages;
  };
  let pendingApproval = normalizePendingApproval(state.pendingApproval);
  let lastEventSequence = state.lastEventSequence || 0;

  if (!event || !event.type) {
    return {
      messages: nextMessages,
      pendingApproval,
      lastEventSequence,
    };
  }

  const eventSequence = event.sequence || 0;
  if (eventSequence > lastEventSequence) {
    lastEventSequence = eventSequence;
  }

  switch (event.type) {
    case 'chat.message': {
      const data = event.data || {};
      ensureMutableMessages().push(
        createAgentMessage(
          data.role === 'user' ? 'user' : 'assistant',
          'normal',
          data.content || '',
          contextSnapshot,
          { eventSequence }
        )
      );
      break;
    }
    case 'chat.trace': {
      ensureMutableMessages().push(
        createAgentMessage(
          'system',
          'trace',
          '',
          contextSnapshot,
          {
            trace: buildTraceContent(event.data || {}),
            eventSequence,
          }
        )
      );
      break;
    }
    case 'chat.suggested_actions': {
      const data = event.data || {};
      const assistantMessageIndex = findLatestAssistantNormalMessageIndex(nextMessages);
      if (assistantMessageIndex > -1) {
        const mutableMessages = ensureMutableMessages();
        mutableMessages[assistantMessageIndex] = {
          ...mutableMessages[assistantMessageIndex],
          suggestedActions: Array.isArray(data.actions) ? data.actions : [],
          suggestedActionSummary: data.summary || '后续建议',
          eventSequence,
        };
      } else {
        ensureMutableMessages().push(
          createAgentMessage(
            'system',
            'suggested_actions',
            data.summary || '后续建议',
            contextSnapshot,
            {
              suggestedActions: Array.isArray(data.actions) ? data.actions : [],
              eventSequence,
            }
          )
        );
      }
      break;
    }
    case 'approval.requested': {
      const data = event.data || {};
      pendingApproval = {
        approvalId: data.approval_id || '',
        description: data.description || '',
        risk: data.risk || 'medium',
        runId: event.runId || '',
        sessionId: event.sessionId || '',
        status: 'pending',
        lastSequence: eventSequence,
        skillId: data.skill_id || '',
        targetRef: data.target_ref || null,
        scope: data.scope || '',
        scopeLabel: data.scope_label || '',
        levelLabel: data.level_label || '',
      };

      // Dedupe: skip if a message with this approvalId already exists.
      // Multiple SSE streams (e.g. sendMessage stream + decideAgentApproval
      // stream) can deliver the same approval.requested event to the reducer;
      // only the first push should create a UI card.
      const existingApprovalIndex = findApprovalMessageIndex(
        nextMessages,
        pendingApproval.approvalId
      );
      if (existingApprovalIndex === -1) {
        ensureMutableMessages().push(
          createAgentMessage(
            'system',
            'approval',
            data.description || '待审批操作',
            contextSnapshot,
            {
              approval: pendingApproval,
              eventSequence,
            }
          )
        );
      }
      break;
    }
    case 'approval.resolved': {
      const data = event.data || {};
      const approvalId = data.approval_id;
      const index = findApprovalMessageIndex(nextMessages, approvalId);
      if (index > -1) {
        const mutableMessages = ensureMutableMessages();
        mutableMessages[index] = {
          ...mutableMessages[index],
          approval: {
            ...(mutableMessages[index].approval || {}),
            approvalId,
            status: data.status || 'approved',
            lastSequence: eventSequence,
          },
        };
      }
      if (pendingApproval && pendingApproval.approvalId === approvalId) {
        pendingApproval = null;
      }
      break;
    }
    case 'run.status': {
      const data = event.data || {};
      if (data.status === 'cancelled') {
        ensureMutableMessages().push(
          createAgentMessage(
            'system',
            'status',
            '本次操作已取消。',
            contextSnapshot,
            { eventSequence }
          )
        );
      } else if (data.status === 'error') {
        ensureMutableMessages().push(
          createAgentMessage(
            'system',
            'error',
            '执行过程中发生错误，请稍后重试。',
            contextSnapshot,
            { eventSequence }
          )
        );
      }
      if (pendingApproval && data.status === 'waiting_approval') {
        pendingApproval = {
          ...pendingApproval,
          lastSequence: eventSequence,
        };
      }
      break;
    }
    case 'run.error': {
      const data = event.data || {};
      ensureMutableMessages().push(
        createAgentMessage(
          'system',
          'error',
          data.message || data.error || '执行过程中发生错误，请稍后重试。',
          contextSnapshot,
          { eventSequence }
        )
      );
      break;
    }
    case 'workflow.completed': {
      const data = event.data || {};
      const structuredResult = data.structured_result || {};
      const suggestedActions = Array.isArray(structuredResult.suggestedActions)
        ? structuredResult.suggestedActions
        : [];
      if (suggestedActions.length > 0) {
        const assistantMessageIndex = findLatestAssistantNormalMessageIndex(nextMessages);
        if (assistantMessageIndex > -1 && !nextMessages[assistantMessageIndex].suggestedActions) {
          const mutableMessages = ensureMutableMessages();
          mutableMessages[assistantMessageIndex] = {
            ...mutableMessages[assistantMessageIndex],
            suggestedActions,
            suggestedActionSummary: '后续建议',
            eventSequence,
          };
        }
      }
      break;
    }
    default:
      break;
  }

  return {
    messages: nextMessages,
    pendingApproval,
    lastEventSequence,
  };
}

module.exports = {
  applyAgentEvent,
  createAgentMessage,
  normalizePendingApproval,
};
