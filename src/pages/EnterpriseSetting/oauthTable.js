/*
  挂载共享目录组件
*/

import React, { PureComponent } from 'react';
import { Table, Modal, Button, Tooltip } from 'antd';
import styles from '../../components/CreateTeam/index.less';

export default class OauthTable extends PureComponent {
  constructor(props) {
    super(props);
  }

  handleSubmit = () => {
    const { onOk } = this.props;
    onOk && onOk();
  };

  render() {
    const { onCancel, oauthTable } = this.props;
    return (
      <Modal
        title="Oauth"
        className={styles.TelescopicModal}
        width={1150}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button typs="primary" onClick={this.handleSubmit}>
            确定
          </Button>,
        ]}
      >
        <Table
          dataSource={oauthTable}
          style={{ width: '100%', overflowX: 'auto' }}
          columns={[
            {
              title: 'OAuth类型',
              dataIndex: 'oauth_type',
              key: '1',
              width: '10%',
            },
            {
              title: '名称',
              dataIndex: 'name',
              key: '2',
              width: '15%',
            },
            {
              title: '客户端ID',
              dataIndex: 'client_id',
              key: '3',
              width: '20%',
              render: data => (
                <Tooltip title={data}>
                  <span
                    style={{
                      wordBreak: 'break-all',
                      wordWrap: 'break-word',
                    }}
                  >
                    {data}
                  </span>
                </Tooltip>
              ),
            },
            {
              title: '客户端密钥',
              dataIndex: 'client_secret',
              key: '4',
              width: '20%',
              render: (text, record) => {
                return (
                  <Tooltip title={text}>
                    <span
                      style={{
                        wordBreak: 'break-all',
                        wordWrap: 'break-word',
                      }}
                    >
                      {text}
                    </span>
                  </Tooltip>
                );
              },
            },
            {
              title: '平台访问域名',
              dataIndex: 'home_url',
              key: '5',
              width: '20%',
              render: (v, data) => {
                return (
                  <Tooltip title={v}>
                    <span
                      style={{
                        wordBreak: 'break-all',
                        wordWrap: 'break-word',
                      }}
                    >
                      {v}
                    </span>
                  </Tooltip>
                );
              },
            },
            {
              title: '是否打开自动登录',
              dataIndex: 'is_auto_login',
              key: '6',
              align: 'center',
              width: '15%',
              render: v => {
                return <span>{v ? '是' : '否'}</span>;
              },
            },
          ]}
        />
      </Modal>
    );
  }
}
