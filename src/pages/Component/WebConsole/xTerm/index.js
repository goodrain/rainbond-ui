/* eslint-disable react/sort-comp */
/* eslint-disable object-shorthand */
import md5 from 'js-md5';
import React, { PureComponent } from 'react';
import 'xterm/dist/xterm.css';
import { ConnectionFactory } from '../../../../utils/webconsole/websocket';
import { protocols, WebTTY } from '../../../../utils/webconsole/webtty';
import { Xterm as XTermCustom } from '../../../../utils/webconsole/xterm';
import XTerm from '../ReactXTerm/react-xterm';

class App extends PureComponent {
  constructor(args) {
    super(args);
    this.inputRef = React.createRef();
    this.state = {
      message: '正在连接',
    };
  }

  componentDidMount() {
    this.EstablishConnection();
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
      } = this.props;
      if (!this.inputRef.current) {
        return null;
      }
      const term = this.inputRef.current.getTerminal();
      // The code below is very slow
      // console.log(new Date());
      // term.setOption(
      //   'fontFamily',
      //   '"DejaVu Sans Mono", "Everson Mono", FreeMono, Menlo, Terminal, monospace, "Apple Symbols"'
      // );
      // term.setOption('fontSize', 16);
      // console.log(new Date());
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
      xterm.removeMessage = this.clearMessage;
      xterm.setWindowTitle = title => {
        updateTitle && updateTitle(title);
      };
      const wt = new WebTTY(xterm, factory, args, gottyAuthToken);
      const closer = wt.open();
      this.closer = closer;
      this.clearMessage();
    });
  };

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
      <div style={{ height: '100vh', backgroundColor: 'rgb(0, 0, 0)' }}>
        <XTerm ref={this.inputRef} />
        {message && <div className="xterm-overlay">{message}</div>}
      </div>
    );
  }
}

export default App;
