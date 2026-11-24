/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
export const protocols = ['webtty'];

export const msgInputUnknown = '0';
export const msgInput = '1';
export const msgPing = '2';
export const msgResizeTerminal = '3';
export const msgOutputConsumed = '4';

const maxPendingOutputBytes = 256 * 1024;

export const msgUnknownOutput = '0';
export const msgOutput = '1';
export const msgPong = '2';
export const msgSetWindowTitle = '3';
export const msgSetPreferences = '4';
export const msgSetReconnect = '5';

export interface Terminal {
  info(): { columns: number; rows: number };
  output(data: string, onConsumed?: () => void): void;
  showMessage(message: string, timeout: number): void;
  removeMessage(): void;
  setWindowTitle(title: string): void;
  setPreferences(value: object): void;
  onInput(callback: (input: string) => void): void;
  onResize(callback: (colmuns: number, rows: number) => void): void;
  reset(): void;
  deactivate(): void;
  close(): void;
}

export interface Connection {
  open(): void;
  close(): void;
  send(data: string): void;
  isOpen(): boolean;
  onOpen(callback: () => void): void;
  onReceive(callback: (data: string) => void): void;
  onClose(callback: () => void): void;
}

export interface ConnectionFactory {
  create(): Connection;
}

export class WebTTY {
  term: Terminal;
  connectionFactory: ConnectionFactory;
  args: {};
  authToken: string;
  reconnect: number;
  outputOverflowMessage: string;

  constructor(
    term: Terminal,
    connectionFactory: ConnectionFactory,
    args: {},
    authToken: string,
    outputOverflowMessage = 'Terminal output is too fast. Please reconnect.'
  ) {
    this.term = term;
    this.connectionFactory = connectionFactory;
    this.args = args;
    this.authToken = authToken;
    this.reconnect = -1;
    this.outputOverflowMessage = outputOverflowMessage;
  }

  open() {
    let connection = this.connectionFactory.create();
    let pingTimer: number;
    let reconnectTimeout: number;
    let disposed = false;
    const setup = () => {
      const currentConnection = connection;
      const outputQueue: string[] = [];
      let pendingBytes = 0;
      let writing = false;
      let ended = false;
      let overflow = false;
      let closeMessageWritten = false;
      let flowControl = false;

      const drainOutput = () => {
        if (disposed || writing) return;
        if (!outputQueue.length) {
          if (ended && !closeMessageWritten) {
            closeMessageWritten = true;
            this.term.output('\r\n Connection Closed');
            if (this.reconnect > 0) {
              reconnectTimeout = window.setTimeout(() => {
                if (disposed) return;
                connection = this.connectionFactory.create();
                this.term.reset();
                setup();
              }, this.reconnect * 1000);
            }
          }
          return;
        }
        const output = outputQueue.shift() as string;
        writing = true;
        this.term.output(output, () => {
          if (disposed) return;
          writing = false;
          pendingBytes -= output.length;
          if (flowControl && output.length > 0 && !ended && currentConnection.isOpen()) {
            currentConnection.send(msgOutputConsumed + output.length);
          }
          drainOutput();
        });
      };

      connection.onOpen(() => {
        if (disposed) return;
        const termInfo = this.term.info();

        currentConnection.send(JSON.stringify({ ...this.args, flow_control: true }));

        const resizeHandler = (colmuns: number, rows: number) => {
          currentConnection.send(
            msgResizeTerminal +
              JSON.stringify({
                columns: colmuns,
                rows,
              })
          );
        };
        this.term.onResize(resizeHandler);
        resizeHandler(termInfo.columns, termInfo.rows);

        this.term.onInput((input: string) => {
          for (let i = 0; i < input.length / 1000; i += 1) {
            const sendMsg = input.substr(1000 * i, 1000);
            currentConnection.send(msgInput + sendMsg);
          }
        });

        pingTimer = window.setInterval(() => {
          currentConnection.send(msgPing);
        }, 30 * 1000);
      });

      connection.onReceive(data => {
        if (disposed || ended || overflow) return;
        const payload = data.slice(1);
        switch (data[0]) {
          case msgOutput:
            const output = atob(payload);
            if (pendingBytes + output.length > maxPendingOutputBytes) {
              overflow = true;
              this.reconnect = -1;
              this.term.showMessage(this.outputOverflowMessage, 0);
              currentConnection.close();
              break;
            }
            pendingBytes += output.length;
            outputQueue.push(output);
            drainOutput();
            break;
          case msgPong:
            break;
          case msgSetWindowTitle:
            this.term.setWindowTitle(payload);
            break;
          case msgSetPreferences:
            const preferences = JSON.parse(payload);
            flowControl = !!preferences && preferences.flowControl === true;
            this.term.setPreferences(preferences);
            break;
          case msgSetReconnect:
            this.reconnect = -1;
            break;
          default:
            break;
        }
      });

      connection.onClose(() => {
        clearInterval(pingTimer);
        if (disposed || ended) return;
        ended = true;
        this.term.deactivate();
        drainOutput();
      });

      connection.open();
    };

    setup();
    return () => {
      if (disposed) return;
      disposed = true;
      clearInterval(pingTimer);
      clearTimeout(reconnectTimeout);
      this.reconnect = -1;
      this.term.deactivate();
      connection.close();
    };
  }
}
