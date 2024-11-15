/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
export const protocols = ['webtty'];

export const msgInputUnknown = '0';
export const msgInput = '1';
export const msgPing = '2';
export const msgResizeTerminal = '3';

export const msgUnknownOutput = '0';
export const msgOutput = '1';
export const msgPong = '2';
export const msgSetWindowTitle = '3';
export const msgSetPreferences = '4';
export const msgSetReconnect = '5';

export interface Terminal {
  info(): { columns: number; rows: number };
  output(data: string): void;
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

  constructor(
    term: Terminal,
    connectionFactory: ConnectionFactory,
    args: {},
    authToken: string
  ) {
    this.term = term;
    this.connectionFactory = connectionFactory;
    this.args = args;
    this.authToken = authToken;
    this.reconnect = -1;
  }

  open() {
    let connection = this.connectionFactory.create();
    let pingTimer: number;
    let reconnectTimeout: number;
    const setup = () => {
      connection.onOpen(() => {
        const termInfo = this.term.info();

        connection.send(JSON.stringify(this.args));

        const resizeHandler = (colmuns: number, rows: number) => {
          connection.send(
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
            connection.send(msgInput + sendMsg);
          }
        });

        pingTimer = window.setInterval(() => {
          connection.send(msgPing);
        }, 30 * 1000);
      });

      connection.onReceive(data => {
        const payload = data.slice(1);
        switch (data[0]) {
          case msgOutput:
            this.term.output(atob(payload));
            break;
          case msgPong:
            break;
          case msgSetWindowTitle:
            this.term.setWindowTitle(payload);
            break;
          case msgSetPreferences:
            const preferences = JSON.parse(payload);
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
        this.term.deactivate();
        this.term.output('');
        this.term.output('\n Connection Closed');
        if (this.reconnect > 0) {
          reconnectTimeout = window.setTimeout(() => {
            connection = this.connectionFactory.create();
            this.term.reset();
            setup();
          }, this.reconnect * 1000);
        }
      });

      connection.open();
    };

    setup();
    return () => {
      clearTimeout(reconnectTimeout);
      this.reconnect = -1;
      connection.close();
    };
  }
}
