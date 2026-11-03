function sameStreamRun(item, runId) {
  if (!runId) return true;
  if (item.streamRunId) return item.streamRunId === runId;
  // Legacy hydrated messages have a streamMessageId but no streamRunId. They
  // only belong to the incoming run if they were still streaming; a completed
  // legacy bubble must never be overwritten by a new run that reuses the id.
  return item.streaming === true;
}

function findStreamMessageIndex(messages, messageId, runId) {
  return messages.findIndex(
    item =>
      item &&
      item.streamMessageId === messageId &&
      sameStreamRun(item, runId)
  );
}

function stopOtherReasoningStreams(messages, keepMessageId, keepRunId) {
  return messages.map(item => {
    if (
      !item ||
      (item.streamMessageId === keepMessageId && sameStreamRun(item, keepRunId))
    ) {
      return item;
    }
    if (!item.reasoningStreaming) return item;
    return { ...item, reasoningStreaming: false };
  });
}

function applyStreamingAssistantEvent(messages, event, createMessage, contextSnapshot) {
  const nextMessages = Array.isArray(messages) ? messages.slice() : [];
  const data = (event && event.data) || {};
  const messageId = data.message_id || '';
  const runId = (event && event.runId) || '';

  if (!messageId) {
    return nextMessages;
  }

  const index = findStreamMessageIndex(nextMessages, messageId, runId);

  if (event.type === 'chat.message.started') {
    if (index === -1) {
      nextMessages.push(
        createMessage(
          data.role === 'user' ? 'user' : 'assistant',
          'normal',
          '',
          contextSnapshot,
          {
            streamMessageId: messageId,
            streamRunId: runId,
            streaming: true,
          }
        )
      );
    } else {
      nextMessages[index] = {
        ...nextMessages[index],
        streamRunId: nextMessages[index].streamRunId || runId,
        streaming: true,
      };
    }
    return nextMessages;
  }

  if (event.type === 'chat.message.delta') {
    if (index === -1) {
      nextMessages.push(
        createMessage(
          'assistant',
          'normal',
          data.delta || '',
          contextSnapshot,
          {
            streamMessageId: messageId,
            streamRunId: runId,
            streaming: true,
          }
        )
      );
      return nextMessages;
    }

    nextMessages[index] = {
      ...nextMessages[index],
      streamRunId: nextMessages[index].streamRunId || runId,
      content: `${nextMessages[index].content || ''}${data.delta || ''}`,
      streaming: true,
    };
    return nextMessages;
  }

  if (event.type === 'chat.message.completed') {
    if (index === -1) {
      nextMessages.push(
        createMessage(
          'assistant',
          'normal',
          data.content || '',
          contextSnapshot,
          {
            streamMessageId: messageId,
            streamRunId: runId,
            streaming: false,
          }
        )
      );
      return nextMessages;
    }

    nextMessages[index] = {
      ...nextMessages[index],
      streamRunId: nextMessages[index].streamRunId || runId,
      content: data.content || nextMessages[index].content || '',
      streaming: false,
      reasoningStreaming: false,
    };
    return nextMessages;
  }

  if (event.type === 'chat.message' && index > -1) {
    nextMessages[index] = {
      ...nextMessages[index],
      streamRunId: nextMessages[index].streamRunId || runId,
      content: data.content || nextMessages[index].content || '',
      streaming: false,
    };
  }

  if (
    event.type === 'chat.message.reasoning.started' ||
    event.type === 'chat.message.reasoning.delta'
  ) {
    for (let i = 0; i < nextMessages.length; i += 1) {
      if (
        nextMessages[i] &&
        !(
          nextMessages[i].streamMessageId === messageId &&
          sameStreamRun(nextMessages[i], runId)
        )
      ) {
        nextMessages[i] = { ...nextMessages[i], reasoningStreaming: false };
      }
    }
  }

  if (event.type === 'chat.message.reasoning.started') {
    if (index === -1) {
      nextMessages.push(
        createMessage(
          'assistant',
          'normal',
          '',
          contextSnapshot,
          {
            streamMessageId: messageId,
            streamRunId: runId,
            streaming: true,
            reasoning: '',
            reasoningStreaming: true,
          }
        )
      );
    } else {
      nextMessages[index] = {
        ...nextMessages[index],
        reasoning: nextMessages[index].reasoning || '',
        reasoningStreaming: true,
      };
    }
    return nextMessages;
  }

  if (event.type === 'chat.message.reasoning.delta') {
    if (index === -1) {
      nextMessages.push(
        createMessage(
          'assistant',
          'normal',
          '',
          contextSnapshot,
          {
            streamMessageId: messageId,
            streamRunId: runId,
            streaming: true,
            reasoning: data.delta || '',
            reasoningStreaming: true,
          }
        )
      );
      return nextMessages;
    }

    nextMessages[index] = {
      ...nextMessages[index],
      streamRunId: nextMessages[index].streamRunId || runId,
      reasoning: `${nextMessages[index].reasoning || ''}${data.delta || ''}`,
      reasoningStreaming: true,
    };
    return nextMessages;
  }

  if (event.type === 'chat.message.reasoning.completed' && index > -1) {
    nextMessages[index] = {
      ...nextMessages[index],
      streamRunId: nextMessages[index].streamRunId || runId,
      reasoning:
        data.reasoning || nextMessages[index].reasoning || '',
      reasoningStreaming: false,
    };
    return nextMessages;
  }

  return nextMessages;
}

// A terminal run.status means the run will not emit more assistant output, so
// any row still marked streaming must be finalized even if the matching
// chat.message.completed was lost in the replay/live race. Otherwise the row
// keeps rendering as plain text (raw **, ` and table pipes).
function finalizeStreamingMessages(messages) {
  let changed = false;
  const nextMessages = (Array.isArray(messages) ? messages : []).map(item => {
    if (!item || item.role !== 'assistant') {
      return item;
    }
    if (!item.streaming && !item.reasoningStreaming) {
      return item;
    }
    changed = true;
    return {
      ...item,
      streaming: false,
      reasoningStreaming: false,
    };
  });
  return changed ? nextMessages : messages;
}

module.exports = {
  applyStreamingAssistantEvent,
  finalizeStreamingMessages,
};
