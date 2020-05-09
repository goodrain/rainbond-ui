/* eslint-disable class-methods-use-this */
export class Connection {
  bare: WebSocket;

  constructor(url: string, protocols: string[]) {
    this.bare = new WebSocket(url, protocols);
  }

  open() {}

  close() {
    this.bare.close();
  }

  send(data: string) {
    if (
      this.bare.readyState === WebSocket.CLOSED ||
      this.bare.readyState === WebSocket.CLOSING
    ) {
      return;
    }
    this.bare.send(data);
  }

  isOpen(): boolean {
    if (
      this.bare.readyState === WebSocket.CONNECTING ||
      this.bare.readyState === WebSocket.OPEN
    ) {
      return true;
    }
    return false;
  }

  onOpen(callback: () => void) {
    this.bare.onopen = () => {
      callback();
    };
  }

  onReceive(callback: (data: string) => void) {
    this.bare.onmessage = event => {
      callback(event.data);
    };
  }

  onClose(callback: () => void) {
    this.bare.onclose = () => {
      callback();
    };
  }
}

export class ConnectionFactory {
  url: string;
  protocols: string[];

  constructor(url: string, protocols: string[]) {
    this.url = url;
    this.protocols = protocols;
  }

  create(): Connection {
    return new Connection(this.url, this.protocols);
  }
}
