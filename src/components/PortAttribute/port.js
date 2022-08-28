/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-script-url */
/* eslint-disable react/no-multi-comp */
/* eslint-disable eqeqeq */
/* eslint-disable no-unused-expressions */
import {
  Switch,
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';

class Index extends PureComponent {
  constructor(props) {
    super(props);
  }
  render() {
    const { port } = this.props;
    return (
      <table
        className={styles.table}
        style={{
          width: '100%',
          marginBottom: 8
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: 60
              }}
            >
              {formatMessage({id:'enterpriseColony.import.recognition.tabs.port.port_number'})}
            </th>
            <th
              style={{
                width: 100
              }}
            >
              {formatMessage({id:'enterpriseColony.import.recognition.tabs.port.agreement'})}
            </th>
            <th
              style={{
                width: '50%'
              }}
            >
              {formatMessage({id:'enterpriseColony.import.recognition.tabs.port.message'})}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{port.port ? port.port : "-"}</td>
            <td>
              {port.protocol ? port.protocol : "-"}
            </td>
            <td>
              <div
                style={{
                  borderBottom: '1px solid #e8e8e8',
                  marginBottom: 8,
                  paddingBottom: 8
                }}
              >
                <p>
                  <span className={styles.label}>{formatMessage({id:'enterpriseColony.import.recognition.tabs.port.internal'})}</span>
                  <Switch
                    disabled
                    defaultChecked={port.inner ? port.inner : false}
                    size="small"
                  />
                </p>
                <p>
                  <span className={styles.label}>{formatMessage({id:'enterpriseColony.import.recognition.tabs.port.address'})}</span>
                  {'-'}
                </p>
                <p className={styles.lr}>
                  {/* <span className={styles.label}>使用别名</span> */}
                  {/* {showAlias} */}
                </p>
              </div>
              <div>
                <p>
                  <span className={styles.label}>{formatMessage({id:'enterpriseColony.import.recognition.tabs.port.foreign'})}</span>
                  <Switch
                    disabled
                    defaultChecked={port.outer ? port.inner : false}
                    size="small"
                  />
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}
export default Index