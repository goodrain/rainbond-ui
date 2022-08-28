import { Alert, Button, notification, Row, Table } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { Component, Fragment } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import AccesstokenForm from '../../../components/AccesstokenForm';
import ConfirmModal from '../../../components/ConfirmModal';

@connect(({ loading }) => ({
  deleteAccessLoading: loading.effects['user/deleteAccessToke']
}))
class BindingView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
      openDeleteAccessToken: false,
      ID: '',
      visible: false
    };
  }

  componentDidMount() {
    this.loadAccessTokenList();
  }

  onCanceAccessToken = () => {
    this.setState({
      openDeleteAccessToken: false,
      ID: ''
    });
  };
  loadAccessTokenList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchAccessToken',
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            dataSource: res.list
          });
        }
      }
    });
  };

  handleDeleteAccessToken = () => {
    const { dispatch } = this.props;
    const { ID } = this.state;
    dispatch({
      type: 'user/deleteAccessToke',
      payload: {
        user_id: ID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
          this.loadAccessTokenList();
          this.onCanceAccessToken();
        }
      }
    });
  };
  addAccessToken = () => {
    this.setState({ visible: true });
  };
  handleCancel = () => {
    this.setState({ visible: false, ID: '' });
  };
  openDeleteAccessToken = ID => {
    this.setState({
      ID,
      openDeleteAccessToken: true
    });
  };

  handleRegenerateAccessToken = ID => {
    this.setState({
      ID,
      visible: true
    });
  };
  disabledDate = current => {
    // Can not select days before today and today
    return current && current < moment().endOf('day');
  };

  disabledDateTime = () => {
    return {
      disabledHours: () => this.range(0, 24).splice(4, 20),
      disabledMinutes: () => this.range(30, 60),
      disabledSeconds: () => [55, 56]
    };
  };

  range = (start, end) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  handleSubmit = () => {
    this.loadAccessTokenList();
    this.handleCancel();
  };

  handleExpireTime = val => {
    let date = '';
    const str = val ? `${val}` : '';
    if (val && str.length === 10) {
      date = new Date(parseInt(val) * 1000);
      return date;
    } else if (val && str.length === 13) {
      date = new Date(parseInt(val));
      return date;
    }
    return null;
  };

  render() {
    const { deleteAccessLoading } = this.props;
    const { dataSource, openDeleteAccessToken, visible, ID } = this.state;
    const columns = [
      {
        title: '用途',
        dataIndex: 'note',
        key: 'note',
        width: '30%'
      },
      {
        title: '过期时间',
        dataIndex: 'expire_time',
        key: 'expire_time',
        width: '25%',
        render: val => {
          const endTime = this.handleExpireTime(val);
          if (endTime) {
            return moment(endTime)
              .locale('zh-cn')
              .format('YYYY-MM-DD HH:mm:ss');
          }
          return '不限制';
        }
      },
      {
        title: '状态',
        dataIndex: 'user_id',
        key: 'user_id',
        width: '20%',
        render: (res, data) => {
          const endTime = this.handleExpireTime(data.expire_time);
          const startTime = moment().valueOf();
          const isOverdue = endTime ? startTime >= endTime : false;
          return (
            <Fragment>
              <div
                style={{
                  color: isOverdue ? '#f81d22' : ' #0b8235'
                }}
              >
                {isOverdue ? '过期' : '正常'}
              </div>
            </Fragment>
          );
        }
      },
      {
        title: '操作',
        dataIndex: 'var',
        width: '20%',

        render: (res, data) => (
          <Fragment>
            <a
              onClick={() => this.openDeleteAccessToken(data.ID)}
              style={{ margintRight: 10 }}
            >
              删除
            </a>
            <a
              onClick={() => {
                this.handleRegenerateAccessToken(data.ID);
              }}
              style={{ margintRight: 10 }}
            >
              重新生成
            </a>
          </Fragment>
        )
      }
    ];

    return (
      <Fragment>
        <Alert
          message="访问令牌用于访问平台API, 访问令牌的权限与你的账号权限一致"
          type="info"
          showIcon
          style={{ margin: '20px' }}
        />
        <Row style={{ textAlign: 'right' }}>
          <Button
            style={{ margin: '0  5px 20px 0' }}
            type="primary"
            onClick={this.addAccessToken}
          >
            新增
          </Button>
        </Row>
        <Table dataSource={dataSource} columns={columns} pagination={false} />
        {visible && (
          <AccesstokenForm
            onOk={this.handleSubmit}
            onCancel={this.handleCancel}
            ID={ID}
          />
        )}
        {openDeleteAccessToken && (
          <ConfirmModal
            title={formatMessage({ id: 'confirmModal.token.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.token.desc' })}
            loading={deleteAccessLoading}
            onCancel={this.onCanceAccessToken}
            onOk={this.handleDeleteAccessToken}
          />
        )}
      </Fragment>
    );
  }
}

export default BindingView;
