const LOG_QUERY_LIMIT = 5000;

function normalizeRange(from, to) {
  const rangeStart = Number(from);
  const rangeEnd = Number(to);

  if (
    !Number.isFinite(rangeStart) ||
    !Number.isFinite(rangeEnd) ||
    rangeEnd <= rangeStart
  ) {
    throw new Error('日志时间范围无效');
  }

  return {
    from: Math.floor(rangeStart),
    to: Math.floor(rangeEnd)
  };
}

function buildLogCountExpression(expression, from, to) {
  const normalizedExpression = String(expression || '').trim();

  if (!normalizedExpression) {
    throw new Error('日志查询表达式不能为空');
  }

  const range = normalizeRange(from, to);
  const durationMs = Math.max(1, range.to - range.from);

  return `sum(count_over_time(${normalizedExpression} [${durationMs}ms]))`;
}

function getFrameValueIndex(frame) {
  const fields = (frame && frame.schema && frame.schema.fields) || [];
  const exactValueIndex = fields.findIndex(
    field => String((field && field.name) || '').toLowerCase() === 'value'
  );

  if (exactValueIndex > -1) {
    return exactValueIndex;
  }

  const namedValueIndex = fields.findIndex(field =>
    String((field && field.name) || '')
      .toLowerCase()
      .startsWith('value ')
  );

  if (namedValueIndex > -1) {
    return namedValueIndex;
  }

  const values = (frame && frame.data && frame.data.values) || [];
  return values.length > 1 ? 1 : 0;
}

function parseLogCountFrames(frames) {
  if (!Array.isArray(frames)) {
    return 0;
  }

  const total = frames.reduce((sum, frame) => {
    const valueIndex = getFrameValueIndex(frame);
    const frameValues = frame && frame.data && frame.data.values;
    const values = frameValues && frameValues[valueIndex];

    if (!Array.isArray(values) || values.length === 0) {
      return sum;
    }

    const value = Number(values[values.length - 1]);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return Math.max(0, Math.round(total));
}

function parseLokiLogFrames(frames, formatTimestamp) {
  if (!Array.isArray(frames)) {
    return [];
  }

  const logs = [];

  frames.forEach((frame, frameIndex) => {
    const fields = (frame && frame.schema && frame.schema.fields) || [];
    const fieldNames = fields.map(field => field && field.name);
    const values = (frame && frame.data && frame.data.values) || [];
    const timeIndex = fieldNames.indexOf('Time');
    const lineIndex = fieldNames.indexOf('Line');
    const resolvedTimeIndex = timeIndex > -1 ? timeIndex : 1;
    const resolvedLineIndex = lineIndex > -1 ? lineIndex : 2;
    const timeValues = values[resolvedTimeIndex] || [];
    const lineValues = values[resolvedLineIndex] || [];

    timeValues.forEach((timestamp, rowIndex) => {
      if (rowIndex >= lineValues.length) {
        return;
      }

      const line = lineValues[rowIndex];
      if (line === undefined || line === null) {
        return;
      }

      const parsedTimestamp = parseInt(timestamp, 10);
      logs.push({
        id: `${frameIndex}-${parsedTimestamp}-${rowIndex}`,
        timestamp: parsedTimestamp,
        formattedTime:
          typeof formatTimestamp === 'function'
            ? formatTimestamp(parsedTimestamp)
            : String(parsedTimestamp),
        msg: String(line)
      });
    });
  });

  return logs;
}

function createInitialRanges(range, expectedTotal, limit) {
  if (!Number.isFinite(expectedTotal) || expectedTotal <= limit) {
    return [range];
  }

  const durationMs = range.to - range.from;
  const requestedSegmentCount = Math.ceil(
    expectedTotal / Math.max(1, limit - 1)
  );
  const segmentCount = Math.min(durationMs, requestedSegmentCount);
  const ranges = [];

  for (let index = 0; index < segmentCount; index += 1) {
    const segmentFrom =
      range.from + Math.floor(durationMs * index / segmentCount);
    const segmentTo =
      range.from + Math.floor(durationMs * (index + 1) / segmentCount);

    if (segmentTo > segmentFrom) {
      ranges.push({ from: segmentFrom, to: segmentTo });
    }
  }

  return ranges.length ? ranges : [range];
}

async function collectCompleteLogRange({
  from,
  to,
  fetchRange,
  limit = LOG_QUERY_LIMIT,
  expectedTotal,
  onProgress
}) {
  const range = normalizeRange(from, to);

  if (typeof fetchRange !== 'function') {
    throw new Error('缺少日志分段查询方法');
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('日志单批查询上限无效');
  }

  const normalizedExpectedTotal = Number(expectedTotal);
  const pendingRanges = createInitialRanges(
    range,
    normalizedExpectedTotal,
    limit
  ).reverse();
  const collectedLogs = [];

  while (pendingRanges.length > 0) {
    const currentRange = pendingRanges.pop();
    const batch = await fetchRange({
      ...currentRange,
      limit
    });

    if (!Array.isArray(batch)) {
      throw new Error('日志分段查询返回格式无效');
    }

    if (batch.length >= limit) {
      if (currentRange.to - currentRange.from <= 1) {
        throw new Error('单位时间内日志过多，请缩小查询时间范围后重试');
      }

      const midpoint =
        currentRange.from +
        Math.floor((currentRange.to - currentRange.from) / 2);

      pendingRanges.push(
        { from: midpoint, to: currentRange.to },
        { from: currentRange.from, to: midpoint }
      );
      continue;
    }

    collectedLogs.push(...batch);

    if (typeof onProgress === 'function') {
      onProgress(collectedLogs.length);
    }
  }

  if (
    Number.isFinite(normalizedExpectedTotal) &&
    collectedLogs.length < normalizedExpectedTotal
  ) {
    throw new Error(
      `完整日志获取不完整：应有 ${normalizedExpectedTotal} 条，实际获取 ${collectedLogs.length} 条`
    );
  }

  return collectedLogs;
}

module.exports = {
  LOG_QUERY_LIMIT,
  buildLogCountExpression,
  collectCompleteLogRange,
  parseLokiLogFrames,
  parseLogCountFrames
};
