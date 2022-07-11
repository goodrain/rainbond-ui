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
              端口号
            </th>
            <th
              style={{
                width: 100
              }}
            >
              端口协议
            </th>
            <th
              style={{
                width: '50%'
              }}
            >
              服务信息
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{port.port ? port.port : "无"}</td>
            <td>
              {port.protocol ? port.protocol : "无"}
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
                  <span className={styles.label}>对内服务</span>
                  <Switch
                    disabled
                    defaultChecked={port.inner ? port.inner : false}
                    size="small"
                  />
                </p>
                <p>
                  <span className={styles.label}>访问地址</span>
                  {'-'}
                </p>
                <p className={styles.lr}>
                  <span className={styles.label}>使用别名</span>
                  {/* {showAlias} */}
                </p>
              </div>
              <div>
                <p>
                  <span className={styles.label}>对外服务</span>
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