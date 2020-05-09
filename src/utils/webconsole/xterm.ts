/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/prefer-default-export */
import { lib } from 'libapps';
import { Terminal } from 'xterm';

export class Xterm {
  term: Terminal;
  resizeListener: () => void;
  decoder: lib.UTF8Decoder;
  messageTimeout: number;

  constructor(term: Terminal) {
    this.term = term;
    this.messageTimeout = 2000;
    this.resizeListener = () => {
      this.term.scrollToBottom();
      this.showMessage(
        `${String(this.term.cols)}x${String(this.term.rows)}`,
        this.messageTimeout
      );
    };
    this.resizeListener();
    window.addEventListener('resize', () => {
      this.resizeListener();
    });
    this.decoder = new lib.UTF8Decoder();
  }

  info(): { columns: number; rows: number } {
    return { columns: this.term.cols, rows: this.term.rows };
  }

  output(data: string) {
    this.term.write(this.decoder.decode(data));
  }

  showMessage(message: string, timeout: number) {}

  removeMessage(): void {}

  setWindowTitle(title: string) {}

  onInput(callback: (input: string) => void) {
    this.term.onData((data, v) => {
      callback(data);
    });
  }

  onResize(callback: (colmuns: number, rows: number) => void) {
    this.term.onResize(data => {
      callback(data.cols, data.rows);
    });
  }
  setPreferences(value: object) {}
  deactivate(): void {
    if (this.term) {
      this.term.blur();
    }
  }

  reset(): void {
    this.removeMessage();
    this.term.reset();
  }

  close(): void {
    window.removeEventListener('resize', this.resizeListener);
    this.term.dispose();
  }
}
