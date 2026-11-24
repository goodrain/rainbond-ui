/* eslint-disable react/sort-comp */
/* eslint-disable object-shorthand */
import md5 from 'js-md5';
import React, { PureComponent } from 'react';
import 'xterm/css/xterm.css';
import { ConnectionFactory } from '../../../../utils/webconsole/websocket';
import { formatMessage } from '@/utils/intl';
import { protocols, WebTTY } from '../../../../utils/webconsole/webtty';
import { Xterm as XTermCustom } from '../../../../utils/webconsole/xterm';
import XTerm from '../ReactXTerm/react-xterm';

function normalizeWebSocketURL(websocketURL) {
  if (!websocketURL || typeof window === 'undefined' || !window.location) {
    return websocketURL;
  }
  try {
    const url = new URL(websocketURL, window.location.href);
    const isWebSocket = url.protocol === 'ws:' || url.protocol === 'wss:';
    const isSameHost = url.host === window.location.host;
    if (isWebSocket && isSameHost) {
      url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return url.toString();
    }
  } catch (e) {
    return websocketURL;
  }
  return websocketURL;
}

class App extends PureComponent {
  constructor(args) {
    super(args);
    this.inputRef = React.createRef();
    this.unmounted = false;
    this.probeSocket = null;
    this.connectionTimer = null;
    this.connectionDelay = null;
    this.messageTimer = null;
    this.state = {
      message: formatMessage({ id: 'otherEnterprise.shell.connection' }),
      bool: 0
    };
  }

  componentDidMount() {
    const { type = false } = this.props;
    if (type) {
      const websocketURL = normalizeWebSocketURL(this.props.WebsocketURL);
      this.probeSocket = new WebSocket(websocketURL);
      this.connectionTimer = setInterval(() => {
        if (this.unmounted || !this.probeSocket) return;
        this.setState({ bool: this.probeSocket.readyState });
        if (this.probeSocket.readyState === WebSocket.OPEN) {
          clearInterval(this.connectionTimer);
          this.probeSocket.close();
          this.probeSocket = null;
          this.connectionDelay = setTimeout(() => {
            if (!this.unmounted) this.EstablishConnection();
          }, 2000);
        }
      }, 1000);
    } else {
      this.EstablishConnection();
    }
  }

  EstablishConnection = () => {
    return new Promise(() => {
      const {
        tenantID,
        serviceID,
        podName,
        containerName,
        WebsocketURL,
        updateTitle,
        namespace,
        mode,
      } = this.props;
      const websocketURL = normalizeWebSocketURL(WebsocketURL);
      if (this.unmounted || !this.inputRef.current) {
        return null;
      }
      const term = this.inputRef.current.getTerminal();
      const consoleWebsocketURL = websocketURL.replace(
        '/event_log',
        '/docker_console'
      );
      const connectionProtocols = consoleWebsocketURL.indexOf('/console/regions/') > -1
        ? []
        : protocols;
      const factory = new ConnectionFactory(consoleWebsocketURL, connectionProtocols);
      const gottyAuthToken = '';
      const hash = md5(`${tenantID}_${serviceID}_${podName}`);
      const args = {
        T_id: tenantID,
        S_id: serviceID,
        C_id: podName,
        containerName: containerName,
        Md5: hash,
        namespace: namespace,
        mode: mode,
      };
      const xterm = new XTermCustom(term);
      xterm.removeMessage = this.clearMessage;
      xterm.showMessage = this.showMessage;
      xterm.setWindowTitle = title => {
        if (mode !== 'debug') {
          updateTitle && updateTitle(title);
        }
      };
      const wt = new WebTTY(
        xterm, factory, args, gottyAuthToken,
        formatMessage({ id: 'otherEnterprise.shell.output_overflow' })
      );
      const closer = wt.open();
      this.closer = closer;
      this.clearMessage();
    });
  };

  componentWillUnmount() {
    this.unmounted = true;
    clearInterval(this.connectionTimer);
    clearTimeout(this.connectionDelay);
    clearTimeout(this.messageTimer);
    if (this.probeSocket) {
      this.probeSocket.close();
      this.probeSocket = null;
    }
    if (this.closer != null) {
      this.closer();
    }
  }

  showMessage = (message, timeout) => {
    if (this.unmounted) return;
    clearTimeout(this.messageTimer);
    this.setState({ message });
    if (timeout > 0) {
      this.messageTimer = setTimeout(this.clearMessage, timeout);
    }
  };

  clearMessage = () => {
    clearTimeout(this.messageTimer);
    if (!this.unmounted) this.setState({ message: '' });
  };

  render() {
    const { message } = this.state;
    const { height } = this.props;
    return (
      <div
        style={{
          height: height ? height : 'calc(100vh - 104px)',
          backgroundColor: 'rgb(0, 0, 0)',
        }}
      >
        <XTerm ref={this.inputRef} />
        {message && <div className="xterm-overlay">{message}</div>}
      </div>
    );
  }
}

export default App;
