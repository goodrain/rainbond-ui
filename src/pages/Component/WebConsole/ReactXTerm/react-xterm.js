/* eslint-disable react/sort-comp */
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';
import React from 'react';
import className from 'classnames';

class XTerm extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onInput = data => {
      if (this.props.onInput) {
        this.props.onInput(data);
      }
    };
    this.state = {
      isFocused: false,
    };
  }
  componentDidMount() {
    this.xterm = new Terminal(this.props.options);
    const fit = new FitAddon();
    this.xterm.loadAddon(fit);
    this.xterm.loadAddon(new SearchAddon());
    this.xterm.loadAddon(new WebLinksAddon());
    this.xterm.setOption('fontSize', 16);
    this.xterm.setOption(
      'fontFamily',
      '"DejaVu Sans Mono", "Everson Mono", FreeMono, Menlo, Terminal, monospace, "Apple Symbols"'
    );
    this.xterm.open(this.refs.container);
    fit.fit();
    if (this.props.onContextMenu) {
      this.xterm.element.addEventListener(
        'contextmenu',
        this.onContextMenu.bind(this)
      );
    }
    if (this.props.onInput) {
      this.xterm.onData(this.onInput);
    }
    if (this.props.value) {
      this.xterm.write(this.props.value);
    }
  }
  componentWillUnmount() {
    if (this.xterm) {
      this.xterm.dispose();
      this.xterm = null;
    }
  }
  getTerminal() {
    return this.xterm;
  }
  write(data) {
    this.xterm.write(data);
  }
  writeln(data) {
    this.xterm.writeln(data);
  }
  focus() {
    if (this.xterm) {
      this.xterm.focus();
    }
  }
  resize(cols, rows) {
    this.xterm.resize(Math.round(cols), Math.round(rows));
  }
  setOption(key, value) {
    this.xterm.setOption(key, value);
  }
  refresh() {
    this.xterm.refresh(0, this.xterm.rows - 1);
  }
  onContextMenu(e) {
    if (this.props.onContextMenu) {
      this.props.onContextMenu(e);
    }
  }
  render() {
    const terminalClassName = className(
      'ReactXTerm',
      this.state.isFocused ? 'ReactXTerm--focused' : null,
      this.props.className
    );
    return React.createElement('div', {
      ref: 'container',
      className: terminalClassName,
    });
  }
}

export default XTerm;
export { XTerm };
