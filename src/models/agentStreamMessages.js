function sameStreamRun(item, runId) {
  if (!runId) return true;
  // Messages created before streamRunId existed are treated as belonging to
  // the incoming run only when they have no run marker.
  return !item.streamRunId || item.streamRunId === runId;
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

module.exports = {
  applyStreamingAssistantEvent,
};
