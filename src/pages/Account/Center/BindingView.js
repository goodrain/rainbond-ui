import { List, Table, Tag, Card, Button, notification, Modal } from 'antd';
import { connect } from 'dva';
import React, { Component, Fragment } from 'react';
import { formatMessage } from '@/utils/intl';
import oauthUtil from '../../../utils/oauth';
import OauthForm from '../../../components/OauthForm';
import rainbondUtil from '../../../utils/rainbond';
const { confirm } = Modal;

@connect(({ user, global, appControl }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  appDetail: appControl.appDetail
}))
class BindingView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      oauthTable: [],
      loading: false,
      oauthInfo: false,
      isClone: false,
      isOpen: false
    };
  }

  componentDidMount() {
    this.fetchOauthInfo();
  }

  fetchOauthInfo = () => {
    const { dispatch, currUser } = this.props;
    this.setState({ loading: true });

    dispatch({
      type: 'global/getOauthInfo',
      payload: {
        enterprise_id: currUser.enterprise_id,
        system: false
      },
      callback: res => {
        if (res?.status_code === 200) {
          this.setState({
            oauthTable: res.list || [],
            loading: false
          });
        }
      }
    });
  };

  handleCreatOauth = values => {
    const { oauth_type, redirect_domain, ...rest } = values;
    const homeUrls = {
      github: 'https://github.com',
      aliyun: 'https://oauth.aliyun.com',
      dingtalk: 'https://oapi.dingtalk.com'
    };

    const oauthData = {
      ...rest,
      oauth_type: oauth_type.toLowerCase(),
      home_url: homeUrls[oauth_type.toLowerCase()] || values.home_url ||'',
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      is_auto_login: false,
      is_console: true,
      system: false
    };

    this.handelRequest(oauthData);
  };

  handelRequest = (obj = {}, isclone) => {
    const { dispatch, currUser } = this.props;
    const { oauthInfo, oauthTable, isOpen } = this.state;
    const arr = [...oauthTable];
    obj.eid = currUser.enterprise_id;
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
        enterprise_id: currUser.enterprise_id,
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
          this.setState({
            oauthInfo: false,
            oauthTable: [],
            visible: false
          },()=>{
            this.fetchOauthInfo();
          })
          
        }
      }
    });
  };

  handleClose = () => {
    this.setState({ visible: false });
  };
  handleDelete = record => {
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
          this.fetchOauthInfo();
        }
      }
    });
  };


  render() {
    const { currUser, enterprise } = this.props;

    if (!currUser) {
      return null;
    }
    const isOauth = rainbondUtil.OauthEnterpriseEnable(enterprise);
    const oauthServices =
      currUser.oauth_services &&
      currUser.oauth_services.length > 0 &&
      currUser.oauth_services;
    const { oauthTable } = this.state;
    const columns = [
      {
        title: formatMessage({ id: 'versionUpdata_6_1.oauth_type' }),
        dataIndex: 'oauth_type',
        key: 'oauth_type'
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.oauth_user_name' }),
        dataIndex: 'name',
        key: 'name'
      },
      {
        // 仓库范围
        title: formatMessage({ id: 'versionUpdata_6_1.oauth_scope' }),
        dataIndex: 'system',
        key: 'system',
        render: (text, record) => {
          return <span>{!text ? formatMessage({ id: 'versionUpdata_6_1.oauth_scope.private' }) : formatMessage({ id: 'versionUpdata_6_1.oauth_scope.public' })}</span>
        }
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.oauth_scope.is_authenticated' }),
        dataIndex: 'is_authenticated',
        key: 'is_authenticated',
        render: (text, record) => {
          return <Tag color={text ? 'green' : '#4d73b1'}>{text ? formatMessage({ id: 'versionUpdata_6_1.oauth_scope.is_authenticated.authenticated' }) : formatMessage({ id: 'versionUpdata_6_1.oauth_scope.is_authenticated.unauthenticated' })}</Tag>
        }
      },
      // 操作
      {
        title: formatMessage({ id: 'versionUpdata_6_1.oauth_scope.action' }),
        key: 'action',
        render: (text, record) => {
          const {
            is_authenticated: isAuthenticated,
            is_expired: isExpired,
            system: isSystem
          } = record;

          const authURL = oauthUtil.getAuthredictURL(record);
          console.log(record,"record");
          
          console.log(authURL,"authURL");
          
          // 提取公共的认证文本
          const getCertificationText = () => {
            if (isAuthenticated) {
              return formatMessage({ id: 'otherEnterprise.BindingView.Certified' });
            }
            if (isExpired) {
              return formatMessage({ id: 'otherEnterprise.BindingView.Expired' });
            }
            return formatMessage({ id: 'otherEnterprise.BindingView.De_certification' });
          };

          // 统一的认证链接处理
          const AuthLink = () => (
            <>
              {!isSystem &&
                <a onClick={() => this.handleDelete(record)} style={{marginRight:10}}>
                  删除
                </a>
              }
              <a
                onClick={() => window.open(`${authURL}&type=certification`, '_blank')}
                href={`${authURL}&type=certification`}
                target="_blank"
                rel="noreferrer"
              >
                {getCertificationText()}
              </a>

            </>

          );

          if (isAuthenticated) {
            return (
              <>
                {!isSystem &&
                  <a onClick={() => this.handleDelete(record)} style={{marginRight:10}}>
                    删除
                  </a>
                }
              </>

            );
          }

          return authURL ? (
            <span style={{ color: '#4d73b1' }}>
              <AuthLink />
            </span>
          ) : null;
        },
      },
    ]

    return (
      <Card
        extra={<Button icon='plus' type="primary" onClick={() => {
          this.setState({
            visible: true
          });
        }}>{formatMessage({ id: 'versionUpdata_6_1.oauth_scope.add' })}</Button>}
      >
        <Table
          dataSource={oauthTable}
          columns={columns}
          pagination={false}
        />
        {this.state.visible && (
          <OauthForm
            title={formatMessage({ id: 'versionUpdata_6_1.oauth_scope.add' })}
            type="private"
            oauthInfo={false}
            onOk={this.handleCreatOauth}
            onCancel={this.handleClose}
          />
        )}
      </Card>
    );
  }
}

export default BindingView;
