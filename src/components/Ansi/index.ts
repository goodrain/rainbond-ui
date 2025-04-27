import { AnserJsonEntry, ansiToJson } from 'anser';
import { escapeCarriageReturn } from 'escape-carriage';
import * as React from 'react';

/**
 * Converts ANSI strings into JSON output.
 * @name ansiToJSON
 * @function
 * @param {String} input The input string.
 * @return {Array} The parsed input.
 */
function ansiToJSON(input: string) {
  input = escapeCarriageReturn(input);
  return ansiToJson(input, {
    json: true,
    remove_empty: true
  });
}

/**
 * Converts an Anser bundle into a React Node.
 * @param linkify whether links should be converting into clickable anchor tags.
 * @param bundle Anser output.
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
    if (bundle.content.indexOf('') > -1 && bundle.content.indexOf('') < 6) {
      style.textIndent =
        bundle.content.indexOf('') !== 0
          ? `${bundle.content.indexOf('') * 2}em`
          : '0';
    }
  }

  return React.createElement('span', { style, key }, bundle.content);
}

declare interface Props {
  children: string;
  className?: string;
  linkify: boolean;
}

export default function Ansi(props: Props) {
  return React.createElement(
    'code',
    { className: props.className },
    ansiToJSON(props.children).map(
      convertBundleIntoReact.bind(null, props.linkify)
    )
  );
}
