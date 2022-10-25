/* eslint-disable react/sort-comp */
/* eslint-disable object-shorthand */
import md5 from 'js-md5';
import React, { PureComponent } from 'react';
import 'xterm/css/xterm.css';
import { ConnectionFactory } from '../../../../utils/webconsole/websocket';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { protocols, WebTTY } from '../../../../utils/webconsole/webtty';
import { Xterm as XTermCustom } from '../../../../utils/webconsole/xterm';
import XTerm from '../ReactXTerm/react-xterm';

class App extends PureComponent {
  constructor(args) {
    super(args);
    this.inputRef = React.createRef();
    this.state = {
      message: formatMessage({ id: 'otherEnterprise.shell.connection' }),
      bool: 0
    };
  }

  componentDidMount() {
    const { WebsocketURL } = this.props;
    var xx = new WebSocket(WebsocketURL)
    const { bool } = this.state;
    const { type = false } = this.props;
    if (type) {
      const time = setInterval(() => {
        this.setState({
          bool: xx.readyState
        }, () => {
          if (this.state.bool == 1) {
            setTimeout(() => {
              this.EstablishConnection();
            }, 2000)
          }
        })
        if (xx.readyState == 1) {
          clearInterval(time)
        }
      }, 1000)
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
      } = this.props;
      if (!this.inputRef.current) {
        return null;
      }
      const term = this.inputRef.current.getTerminal();
      const consoleWebsocketURL = WebsocketURL.replace(
        '/event_log',
        '/docker_console'
      );
      const factory = new ConnectionFactory(consoleWebsocketURL, protocols);
      const gottyAuthToken = '';
      const hash = md5(`${tenantID}_${serviceID}_${podName}`);
      const args = {
        T_id: tenantID,
        S_id: serviceID,
        C_id: podName,
        containerName: containerName,
        Md5: hash,
        namespace: namespace,
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