import anser, { AnserJsonEntry } from 'anser';
import { escapeCarriageReturn } from 'escape-carriage';
import * as React from 'react';

/**
 * Converts ANSI strings into JSON output.
 */
function ansiToJSON(input: string) {
  input = escapeCarriageReturn(input);
  return anser.ansiToJson(input, {
    json: true,
    remove_empty: true,
  });
}

/**
 * Converts an Anser bundle into a React Node.
 */
function convertBundleIntoReact(
  linkify: boolean,
  bundle: AnserJsonEntry,
  key: number
) {
  const style: { backgroundColor?: string; color?: string; textIndent?: string } = {};
  if (bundle.bg) {
    style.backgroundColor = `rgb(${bundle.bg})`;
  }
  if (bundle.fg) {
    style.color = `rgb(${bundle.fg})`;
  }
  if (bundle.content) {
    // 注意：原代码中有两个空字符串 ''，可能是笔误？
    // 假设你想检测制表符 \t 或其他字符，请确认逻辑
    // 这里暂时保留原逻辑，但建议检查
    if (bundle.content.indexOf('') > -1 && bundle.content.indexOf('') < 6) {
      style.textIndent =
        bundle.content.indexOf('') !== 0
          ? `${bundle.content.indexOf('') * 2}em`
          : '0';
    }
  }

  return React.createElement('span', { style, key }, bundle.content);
}

interface Props {
  children: string;
  className?: string;
  linkify: boolean;
}

export default function Ansi(props: Props) {
  return React.createElement(
    'code',
    { className: props.className },
    ansiToJSON(props.children).map((bundle, index) =>
      convertBundleIntoReact(props.linkify, bundle, index)
    )
  );
}