/* eslint-disable object-shorthand */
import md5 from 'js-md5';
import React, { PureComponent } from 'react';
import XTerm from 'react-xterm';
import 'xterm/dist/xterm.css';
import { ConnectionFactory } from '../../../../utils/webconsole/websocket';
import { protocols, WebTTY } from '../../../../utils/webconsole/webtty';
import { Xterm as XTermCustom } from '../../../../utils/webconsole/xterm';

class App extends PureComponent {
  constructor(args) {
    super(args);
    this.inputRef = React.createRef();
    this.state = {
      message: '正在连接',
    };
  }
  componentDidMount() {
    const {
      tenantID,
      serviceID,
      podName,
      containerName,
      WebsocketURL,
    } = this.props;
    const term = this.inputRef.current.getTerminal();
    const consoleWebsocketURL = WebsocketURL.replace(
      '/event_log',
      '/docker_console'
    );
    // Fit screen width
    const fit = require(`xterm/dist/addons/fit/fit`);
    this.inputRef.current.applyAddon(fit);
    fit.fit(term);

    const factory = new ConnectionFactory(consoleWebsocketURL, protocols);
    const gottyAuthToken = '';
    const hash = md5(`${tenantID}_${serviceID}_${podName}`);
    const args = {
      T_id: tenantID,
      S_id: serviceID,
      C_id: podName,
      containerName: containerName,
      Md5: hash,
    };
    const xterm = new XTermCustom(term);
    xterm.showMessage = (message, timeout) => {
      this.setState({ message: message });
      window.setTimeout(() => {
        this.setState({ message: '' });
      }, timeout);
    };
    xterm.removeMessage = this.clearMessage;
    xterm.setWindowTitle = title => {
      const { updateTitle } = this.props;
      if (updateTitle) {
        updateTitle(title);
      }
    };
    const wt = new WebTTY(xterm, factory, args, gottyAuthToken);
    const closer = wt.open();
    this.closer = closer;
    this.clearMessage();
  }

  componentWillUnmount() {
    if (this.closer != null) {
      this.closer();
    }
    if (this.inputRef.current) {
      this.inputRef.current.componentWillUnmount();
    }
  }

  clearMessage = () => {
    this.setState({ message: '' });
  };

  render() {
    const { message } = this.state;
    return (
      <div style={{ height: '100%' }}>
        <XTerm ref={this.inputRef} />
        {message && <div className="xterm-overlay">{message}</div>}
      </div>
    );
  }
}

export default App;
