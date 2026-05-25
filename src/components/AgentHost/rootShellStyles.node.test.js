const assert = require('assert');
const fs = require('fs');
const path = require('path');

const lessPath = path.join(__dirname, 'RootShell.less');
const lessSource = fs.readFileSync(lessPath, 'utf8');

const exitGlowRuleMatch = lessSource.match(
  /\.appViewportLockExit\s+\.appViewportLockGlow\s*\{[\s\S]*?animation:\s*([^;]+);/
);
const enterGlowRuleMatch = lessSource.match(
  /\.appViewportLockEnter\s+\.appViewportLockGlow\s*\{[\s\S]*?animation:\s*([^;]+);/
);

assert.ok(exitGlowRuleMatch, 'exit glow animation rule should exist');
assert.ok(enterGlowRuleMatch, 'enter glow animation rule should exist');

const animationValue = exitGlowRuleMatch[1];
const enterAnimationValue = enterGlowRuleMatch[1];

assert.ok(
  /\bboth\b/.test(animationValue) || /\bbackwards\b/.test(animationValue),
  'exit glow animation should apply its starting keyframe during delay to avoid a visible flicker'
);

assert.ok(
  /appViewportLockGlowBreathe/.test(enterAnimationValue),
  'enter glow animation should include a breathing effect while the viewport remains locked'
);

assert.ok(
  /@keyframes\s+appViewportLockGlowBreathe\b/.test(lessSource),
  'breathing keyframes for the viewport glow should exist'
);

console.log('root shell style tests passed');
