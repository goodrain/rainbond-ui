/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
/* eslint-disable prefer-const */
/*
  挂载共享目录组件
*/
import {
  Alert,
  Button,
  Col,
  Modal,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import styles from '../../components/CreateTeam/index.less';
import OauthForm from '../../components/OauthForm';

const { confirm } = Modal;

@connect(({ loading, global, index }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo
}))
export default class OauthTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      oauthInfo: false,
      oauthTable: [],
      openOauth: false,
      isOpen: false,
      showDeleteDomain: false
    };
  }
  componentDidMount() {
    this.handelOauthInfo();
  }

  handleSubmit = () => {
    const { onOk } = this.props;
    onOk && onOk();
  };

  handleDiv = data => {
    return (
      <Tooltip title={data}>
        <span
          style={{
            wordBreak: 'break-all',
            wordWrap: 'break-word'
          }}
        >
          {data}
        </span>
      </Tooltip>
    );
  };

  handleDel = record => {
    const _th = this;
    confirm({
      title: '删除配置后已绑定的用户数据将清除',
      content: '确定要删除此配置吗？',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        _th.handleDeleteOauth(record);
      }
    });
  };

  handleDeleteOauth = data => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/deleteOauthInfo',
      payload: {
        service_id: data.service_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
          this.handelOauthInfo();
        }
      }
    });
  };

  handleCreatOauth = values => {
    let {
      name,
      client_id,
      client_secret,
      oauth_type,
      home_url,
      redirect_domain,
      is_auto_login
    } = values;
    oauth_type = oauth_type.toLowerCase();
    if (oauth_type === 'github') {
      home_url = 'https://github.com';
    }
    if (oauth_type === 'aliyun') {
      home_url = 'https://oauth.aliyun.com';
    }
    if (oauth_type === 'dingtalk') {
      home_url = 'https://oapi.dingtalk.com';
    }
    const obj = {
      name,
      client_id,
      client_secret,
      is_auto_login,
      oauth_type,
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      home_url,
      is_console: true
    };
    this.handelRequest(obj);
  };
  handelRequest = (obj = {}, isclone) => {
    const { dispatch, eid } = this.props;
    const { oauthInfo, oauthTable, isOpen } = this.state;
    const arr = [...oauthTable];
    obj.eid = eid;
    oauthInfo
      ? (obj.service_id = oauthInfo.service_id)
      : (obj.service_id = null);
    isclone ? (obj.enable = false) : (obj.enable = true);

    if (oauthTable && oauthTable.length > 0) {
      oauthTable.map((item, index) => {
        const { service_id } = item;
        arr[index].is_console = true;
        if (oauthInfo && service_id === obj.service_id) {
          arr[index] = Object.assign(arr[index], obj);
        }
      });
    }
    !oauthInfo && arr.push(obj);
    dispatch({
      type: 'global/creatOauth',
      payload: {
        enterprise_id: eid,
        arr
      },
      callback: data => {
        if (data && data.status_code === 200) {
          notification.success({
            message: isOpen
              ? formatMessage({id:'notification.success.open'})
              : isclone
              ? formatMessage({id:'notification.success.close'})
              : oauthInfo
              ? formatMessage({id:'notification.success.edit'})
              : formatMessage({id:'notification.success.add'})
          });
          this.handelOauthInfo();
        }
      }
    });
  };

  handleOpen = (oauthInfo, isOpen) => {
    this.setState({
      openOauth: true,
      oauthInfo,
      isOpen
    });
  };

  handleOpenDomain = oauthInfo => {
    this.setState({
      oauthInfo,
      showDeleteDomain: true
    });
  };

  handelClone = () => {
    this.setState({
      isOpen: false,
      openOauth: false,
      oauthInfo: false,
      showDeleteDomain: false
    });
  };
  handelOauthInfo = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'global/getOauthInfo',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const lists = res.list && res.list.length > 0 && res.list;
          this.setState({
            loading: false,
            oauthTable: lists || []
          });
          this.handelClone();
        }
      }
    });
  };
  render() {
    const { onCancel, oauthLongin } = this.props;
    const {
      oauthTable,
      loading,
      openOauth,
      oauthInfo,
      showDeleteDomain
    } = this.state;
    let autoLoginOAuth = null;
    oauthTable.map(item => {
      if (item.is_auto_login) {
        autoLoginOAuth = item;
        return item;
      }
      return null;
    });
    return (
      <Modal
        title={formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.title'})}
        loading={loading}
        className={styles.TelescopicModal}
        width={1024}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button style={{ marginTop: '20px' }} onClick={this.handleSubmit}>
            {formatMessage({id:'button.close'})}
          </Button>
        ]}
      >
        <div>
          {showDeleteDomain && (
            <ConfirmModal
              loading={oauthLongin}
              title={formatMessage({id:'confirmModal.forbidden.delete.title'})}
              desc={formatMessage({id:'confirmModal.delete.forbidden.desc'})}
              onOk={() => {
                this.handelRequest(oauthInfo, 'clone');
              }}
              onCancel={this.handelClone}
            />
          )}
          {openOauth && (
            <OauthForm
              loading={oauthLongin}
              oauthInfo={oauthInfo}
              onOk={this.handleCreatOauth}
              onCancel={this.handelClone}
            />
          )}

          <Row gutter={12}>
            <Col span={12}>
              {autoLoginOAuth && (
                <Alert
                  message={`${autoLoginOAuth.name} ${formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.alert'})}`}
                  type="success"
                />
              )}
            </Col>
            <Col span={12} style={{ textAlign: 'right', marginBottom: '10px' }}>
              <Button
                onClick={() => {
                  this.handleOpen(false);
                }}
                type="primary"
                icon="plus"
              >
                {formatMessage({id:'button.add'})}
              </Button>
            </Col>
          </Row>
          <Table
            dataSource={oauthTable}
            style={{ width: '100%', overflowX: 'auto' }}
            columns={[
              {
                title: formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.oauth_type'}),
                dataIndex: 'oauth_type',
                key: '1',
                width: '10%'
              },
              {
                title: formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.name'}),
                dataIndex: 'name',
                key: '2',
                width: '15%'
              },
              {
                title: formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.client_id'}),
                dataIndex: 'client_id',
                key: '3',
                width: '15%',
                render: data => this.handleDiv(data)
              },
              {
                title: formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.client_secret'}),
                dataIndex: 'client_secret',
                key: '4',
                width: '15%',
                render: data => this.handleDiv(data)
              },
              {
                title: formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.home_url'}),
                dataIndex: 'home_url',
                key: '5',
                width: '15%',
                render: data => this.handleDiv(data)
              },
              {
                title: formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.action'}),
                dataIndex: 'action',
                width: '15%',
                key: 'action',
                align: 'center',
                render: (_data, record) => (
                  <div>
                    <a
                      style={{ marginRight: '10px' }}
                      onClick={() => {
                        this.handleDel(record);
                      }}
                    >
                      {formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.del'})}
                    </a>
                    <a
                      style={{ marginRight: '10px' }}
                      onClick={() => {
                        this.handleOpen(record);
                      }}
                    >
                      {formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.edit'})}
                    </a>
                    <a
                      onClick={() => {
                        record.enable
                          ? this.handleOpenDomain(record)
                          : this.handleOpen(record, true);
                      }}
                    >
                      {record.enable ? formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.disable'}) : formatMessage({id:'enterpriseSetting.basicsSetting.serve.Modal.table.enabled'})}
                    </a>
                  </div>
                )
              }
            ]}
          />
        </div>
      </Modal>
    );
  }
}
