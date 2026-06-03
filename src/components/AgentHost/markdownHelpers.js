function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdownToHtml(value) {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

function isMarkdownTableSeparator(line = '') {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}

function parseTableLine(line = '') {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

function renderMarkdownTables(source = '') {
  const lines = String(source || '').split('\n');
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index] || '';
    const nextLine = lines[index + 1] || '';

    if (
      currentLine.trim().startsWith('|') &&
      isMarkdownTableSeparator(nextLine)
    ) {
      const headerCells = parseTableLine(currentLine);
      const rowLines = [];
      index += 2;

      while (index < lines.length && (lines[index] || '').trim().startsWith('|')) {
        rowLines.push(lines[index]);
        index += 1;
      }

      index -= 1;

      const rows = rowLines.map(parseTableLine);
      const headerHtml = headerCells
        .map(cell => `<th>${renderInlineMarkdownToHtml(cell)}</th>`)
        .join('');
      const bodyHtml = rows
        .map(row => (
          `<tr>${row.map(cell => `<td>${renderInlineMarkdownToHtml(cell)}</td>`).join('')}</tr>`
        ))
        .join('');

      output.push(
        `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
      );
      continue;
    }

    output.push(currentLine);
  }

  return output.join('\n');
}

function renderMarkdownSource(content = '') {
  return renderMarkdownTables(content);
}

module.exports = {
  renderInlineMarkdownToHtml,
  renderMarkdownSource,
  renderMarkdownTables,
};
