const assert = require('assert');
const { renderMarkdownSource } = require('./markdownHelpers');

const markdown = [
  '### 应用列表',
  '',
  '当前团队下共有 **1 个应用**。',
  '',
  '| 项目 | 内容 |',
  '|------|------|',
  '| **应用名称** | `java` |',
  '| **应用 ID** | 156 |',
].join('\n');

const html = renderMarkdownSource(markdown);

assert.ok(html.includes('### 应用列表'));
assert.ok(html.includes('<table>'));
assert.ok(html.includes('<th>项目</th>'));
assert.ok(html.includes('<td><strong>应用名称</strong></td>'));
assert.ok(html.includes('<td><code>java</code></td>'));

console.log('agent host markdown helper tests passed');
