/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import {
  Button,
  Card,
  Divider,
  Form,
  Icon,
  Input,
  notification,
  Tabs,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import DescriptionList from '../../../components/DescriptionList';
import globalUtil from '../../../utils/global';
import rainbondUtil from '../../../utils/rainbond';

const { Description } = DescriptionList;
const FormItem = Form.Item;
const { TabPane } = Tabs;

// eslint-disable-next-line react/no-redundant-should-component-update
@connect(({ global }) => ({ rainbondInfo: global.rainbondInfo }), null, null, {
  withRef: true
})
@Form.create()
export default class AutoDeploy extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      display: false,
      status: [false, false, false],
      support_type: 0,
      url: '',
      secret_key: '',
      tabActiveKey: 0,
      setTabActiveKey: false,
      deployment_way: (this.props.service_source === '镜像' || 
        this.props.service_source === 'DockerRun' || 
        this.props.service_source === 'DockerCompose') ?
       'api_webhooks' : 'code_webhooks',
      tabLoading: [false, false, false],
      service_source: this.props.service_source,
      deploy_keyword: 'deploy',
      deploy_mirror: ''
    };
  }

  componentDidMount() {
    this.getInfo();
  }
  shouldComponentUpdate() {
    return true;
  }
  getInfo = () => {
    const { status, deployment_way, tabLoading, setTabActiveKey } = this.state;
    this.props.dispatch({
      type: 'appControl/getAutoDeployStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.app.service.service_alias,
        deployment_way
      },
      callback: data => {
        if (data) {
          const statusing = status;
          const tabLoad = tabLoading;
          const activeKey =
            setTabActiveKey ||
            (data.bean.support_type == 1
              ? 0
              : data.bean.support_type == 2
              ? 1
              : 2);
          statusing.splice(activeKey, 1, data.bean.status || false);
          tabLoad.splice(activeKey, 1, data.bean.status || false);
          this.setState({
            display: data.bean.display,
            status: statusing,
            tabLoading: tabLoad,
            url: data.bean.url,
            secret_key: data.bean.secret_key,
            support_type: data.bean.support_type,
            tabActiveKey: activeKey,
            deploy_keyword: data.bean.deploy_keyword,
            deploy_mirror: data.bean.trigger
          });
        }
        // this.props.form.setFieldsValue({ secret_key: data.bean.secret_key });
      }
    });
  };
  handleCancel = () => {
    this.props.dispatch({
      type: 'appControl/cancelAutoDeploy',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.app.service.service_alias,
        deployment_way: this.state.deployment_way
      },
      callback: () => {
        this.getInfo('cancel');
      }
    });
  };
  handleOpen = () => {
    this.props.dispatch({
      type: 'appControl/openAutoDeploy',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.app.service.service_alias,
        deployment_way: this.state.deployment_way
      },
      callback: () => {
        this.getInfo();
      }
    });
  };
  handleScretSubmit = () => {
    this.props.form.validateFields(['secret_key'], error => {
      if (error) return;
      const secretKey = this.props.form.getFieldValue('secret_key');
      this.props.dispatch({
        type: 'appControl/putAutoDeploySecret',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.app.service.service_alias,
          secret_key: secretKey
        },
        callback: () => {
          notification.success({ message: '更新成功' });
        }
      });
    });
  };

  handleCommandSubmit = () => {
    this.props.form.validateFields(['deploy_keyword'], error => {
      if (error) return;
      const deploy_keyword = this.props.form.getFieldValue('deploy_keyword');
      this.props.dispatch({
        type: 'appControl/putAutoDeployCommand',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.app.service.service_alias,
          keyword: deploy_keyword
        },
        callback: data => {
          if (data && data.status_code === 200) {
            notification.success({ message: '更新成功' });
            this.setState({
              deploy_keyword: data.bean.deploy_keyword
            });
          }
        }
      });
    });
  };

  handleMirrorSubmit = () => {
    this.props.form.validateFields(['deploy_mirror'], error => {
      if (error) return;
      const deploy_mirror = this.props.form.getFieldValue('deploy_mirror');
      this.props.dispatch({
        type: 'appControl/putMirrorCommand',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.app.service.service_alias,
          trigger: deploy_mirror
        },
        callback: data => {
          if (data && data.status_code === 200) {
            notification.success({ message: '更新成功' });
            this.setState({
              deploy_mirror: data.bean.trigger,
              url: data.bean.url
            });
          }
        }
      });
    });
  };

  handleTabs = activeKey => {
    this.setState(
      {
        setTabActiveKey: activeKey,
        tabActiveKey: activeKey,
        deployment_way:
          activeKey == 0
            ? 'code_webhooks'
            : activeKey == 1
            ? 'api_webhooks'
            : 'image_webhooks'
      },
      () => {
        this.getInfo();
      }
    );
  };
  // handleDeployment_way=()=>{
  //   this.setState({
  //     deployment_way:activeKey
  //   })
  // }
  render() {
    if (!this.state.display) return null;
    const { getFieldDecorator } = this.props.form;
    const { rainbondInfo } = this.props;
    const {
      tabActiveKey,
      status,
      tabLoading,
      support_type,
      url,
      service_source
    } = this.state;
    const setUrl = url.replace(
      'http://127.0.0.1:5000',
      `${window.location.protocol}//${window.location.host}`
    );

    const dockerSvg = () => (
      <svg viewBox="0 0 30 50" version="1.1" width="20px" height="20px">
        <path
          style={{ fill: '#03A9F4' }}
          d="M 40 20 C 40.390625 18.265625 39.90625 16.21875 37.5 14 C 33.585938 17.542969 34.703125 21.226563 36 23 C 36 23 35.835938 24 32 24 C 28.164063 24 2 24 2 24 C 2 24 0.167969 40 18 40 C 33.59375 40 37.972656 27.996094 38.828125 24.925781 C 39.183594 24.972656 39.578125 25.003906 40 25 C 42.148438 24.984375 44.929688 23.828125 46 19.515625 C 43.160156 18.53125 41.339844 18.976563 40 20 Z "
        />
        <path
          style={{ fill: '#0288D1' }}
          d="M 2.164063 28 C 2.898438 32.738281 5.984375 40 18 40 C 30.183594 40 35.523438 32.671875 37.683594 28 Z "
        />
        <path
          style={{ fill: '#81D4FA' }}
          d="M 19.8125 39.9375 C 18.890625 39.617188 14.738281 38.847656 14 33 C 9.789063 34.863281 6.0625 34.375 4.421875 34.007813 C 6.582031 37.238281 10.589844 40 18 40 C 18.621094 40 19.222656 39.976563 19.8125 39.9375 Z "
        />
        <path
          style={{ fill: '#FFFFFF' }}
          d="M 20 32 C 20 33.105469 19.105469 34 18 34 C 16.894531 34 16 33.105469 16 32 C 16 30.894531 16.894531 30 18 30 C 19.105469 30 20 30.894531 20 32 Z "
        />
        <path
          style={{ fill: '#37474F' }}
          d="M 14.914063 33.597656 C 15.136719 34.101563 14.933594 34.757813 14.402344 34.914063 C 11.101563 35.886719 8.257813 36.015625 6.105469 36.015625 C 5.464844 35.398438 4.914063 34.738281 4.449219 34.054688 C 7.035156 34.054688 11.160156 33.933594 13.59375 33.089844 C 14.117188 32.90625 14.691406 33.089844 14.914063 33.597656 Z M 2 27 C 2 27 3.875 27.125 5 26 C 6.875 27.6875 10.941406 27.089844 12 26 C 13.0625 27.6875 18.9375 27.375 20 26 C 21.25 27.4375 26.625 27.75 28 26 C 28.480469 27.460938 34.820313 27.875 36 26 C 37.0625 27.089844 41.0625 27.9375 43.3125 26 C 43.875 27.1875 46 27 46 27 L 46 28 L 2 28 M 17 32 C 17 32.550781 17.449219 33 18 33 C 18.550781 33 19 32.550781 19 32 C 19 31.449219 18.550781 31 18 31 C 17.449219 31 17 31.449219 17 32 Z "
        />
        <path
          style={{ fill: '#01579B' }}
          d="M 11 24 L 6 24 L 6 19 L 11 19 Z M 21 19 L 16 19 L 16 24 L 21 24 Z M 31 19 L 26 19 L 26 24 L 31 24 Z M 16 14 L 11 14 L 11 19 L 16 19 Z M 26 14 L 21 14 L 21 19 L 26 19 Z "
        />
        <path
          style={{ fill: '#0288D1' }}
          d="M 16 24 L 11 24 L 11 19 L 16 19 Z M 26 19 L 21 19 L 21 24 L 26 24 Z M 26 9 L 21 9 L 21 14 L 26 14 Z M 21 14 L 16 14 L 16 19 L 21 19 Z "
        />
      </svg>
    );
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    return (
      <Card
        style={{
          marginBottom: 24
        }}
        title="自动构建设置"
      >
        <Tabs
          onChange={activeKey => {
            this.handleTabs(activeKey);
          }}
          tabBarExtraContent={
            <div>
              {status[tabActiveKey] === false ? (
                <Button type="primary" onClick={this.handleOpen}>
                  开启自动构建
                </Button>
              ) : (
                <Button type="primary" onClick={this.handleCancel}>
                  关闭自动构建
                </Button>
              )}
            </div>
          }
        >
          {support_type === 1 && service_source == '源码' && (
            <TabPane
              tab={
                <span>
                  <Icon type="github" />
                  Git-Webhook
                  <Tooltip
                    title={
                      (platform_url && (
                        <a
                          href={`${platform_url}docs/user-manual/component-dev/auto_build/#基于源代码操作流程`}
                          target="_blank"
                          style={{ color: '#fff' }}
                        >
                          点击阅读文档
                        </a>
                      )) ||
                      ''
                    }
                  >
                    {' '}
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              }
              key="0"
            >
              {!tabLoading[0] ? (
                <div
                  style={{
                    textAlign: 'center',
                    height: '80px',
                    lineHeight: '80px'
                  }}
                >
                  暂未开启自动构建
                </div>
              ) : (
                <div>
                  <DescriptionList
                    size="small"
                    style={{
                      borderLeft: '10px solid #38AA56',
                      paddingLeft: '10px',
                      marginBottom: 16
                    }}
                    title=""
                    col="1"
                  >
                    <Description term="支持类型">
                      <div style={{ marginLeft: '38px' }}>
                        Gitlab,Github,Gitee,Gogs,Coding
                      </div>
                    </Description>
                    <Description term="Webhook">
                      <div style={{ marginLeft: '34px' }}>
                        <a>{setUrl} </a>
                        <CopyToClipboard
                          text={setUrl}
                          onCopy={() => {
                            notification.success({ message: '复制成功' });
                          }}
                        >
                          <Button size="small">复制</Button>
                        </CopyToClipboard>
                      </div>
                    </Description>

                    <Description term="触发关键字&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;">
                      <div style={{ display: 'flex' }}>
                        <div
                          style={{
                            paddingTop: '10px',
                            margin: '0 15px 0 -30px'
                          }}
                        >
                          <Tooltip
                            title={
                              <div>
                                当Commit信息包含“@{this.state.deploy_keyword}
                                ”时将自动触发组件自动部署
                              </div>
                            }
                          >
                            <Icon type="question-circle-o" />
                          </Tooltip>
                        </div>
                        {/* <span style={{ paddingTop: "10px" }}>
                        @
                  </span> */}
                        <Form onSubmit={this.handleCommandSubmit}>
                          <FormItem>
                            {getFieldDecorator('deploy_keyword', {
                              initialValue: this.state.deploy_keyword,
                              rules: [
                                {
                                  required: true,
                                  message: '关键字不能为空'
                                }
                              ]
                            })(
                              <Input addonBefore="@" style={{ width: 300 }} />
                            )}
                            <Button
                              onClick={() => {
                                this.handleCommandSubmit();
                              }}
                              style={{
                                marginLeft: 10
                              }}
                              size="small"
                            >
                              更新
                            </Button>
                            <p>
                              注意：当Commit信息包含@{this.state.deploy_keyword}
                              ，则Webhook触发。
                            </p>
                          </FormItem>
                        </Form>
                      </div>
                    </Description>
                  </DescriptionList>
                  <Divider style={{ margin: '16px 0' }} />
                </div>
              )}
            </TabPane>
          )}
          <TabPane
            tab={
              <span>
                <Icon type="api" />
                自定义API
                <Tooltip
                  title={
                    (platform_url && (
                      <a
                        href={`${platform_url}docs/user-manual/component-dev/auto_build/#api-触发自动构建`}
                        target="_blank"
                        style={{ color: '#fff' }}
                      >
                        点击阅读文档
                      </a>
                    )) ||
                    ''
                  }
                >
                  <Icon type="question-circle-o" />
                </Tooltip>
              </span>
            }
            key="1"
          >
            {!tabLoading[1] ? (
              <div
                style={{
                  textAlign: 'center',
                  height: '80px',
                  lineHeight: '80px'
                }}
              >
                暂未开启自动构建
              </div>
            ) : (
              <div>
                <DescriptionList
                  size="small"
                  title=""
                  style={{
                    borderLeft: '10px solid #38AA56',
                    paddingLeft: '10px',
                    marginBottom: 16
                  }}
                  col="1"
                >
                  <Description term="API">
                    <a>{setUrl} </a>
                    <CopyToClipboard
                      text={setUrl}
                      onCopy={() => {
                        notification.success({ message: '复制成功' });
                      }}
                    >
                      <Button size="small">复制</Button>
                    </CopyToClipboard>
                  </Description>
                  <Description term="秘钥" style={{display:'flex'}}>
                    <Form onSubmit={this.handleScretSubmit}>
                      <FormItem style={{ marginTop: '-6px' }}>
                        {getFieldDecorator('secret_key', {
                          initialValue: this.state.secret_key || '',
                          rules: [
                            {
                              required: true,
                              min: 8,
                              message: '秘钥必须大于等于8位'
                            }
                          ]
                        })(<Input style={{ width: 300 }} />)}
                        <Button
                          onClick={this.handleScretSubmit}
                          style={{
                            marginLeft: 10
                          }}
                          size="small"
                        >
                          更新
                        </Button>
                      </FormItem>
                    </Form>
                  </Description>
                </DescriptionList>
              </div>
            )}
          </TabPane>
          {(service_source == '镜像' ||
            service_source == 'DockerCompose' ||
            service_source == 'DockerRun') && (
            <TabPane
              tab={
                <span>
                  {' '}
                  <Icon component={dockerSvg} />
                  镜像仓库Webhook
                  {platform_url && (
                    <Tooltip title="点击阅读文档">
                      <a
                        href={`${platform_url}docs/user-manual/component-dev/auto_build/#基于镜像仓库操作流程`}
                        target="_blank"
                      >
                        <Icon type="question-circle-o" />
                      </a>
                    </Tooltip>
                  )}
                </span>
              }
              key="2"
            >
              {!tabLoading[2] ? (
                <div
                  style={{
                    textAlign: 'center',
                    height: '80px',
                    lineHeight: '80px'
                  }}
                >
                  暂未开启自动构建
                </div>
              ) : (
                <div>
                  <DescriptionList
                    size="small"
                    title=""
                    style={{
                      borderLeft: '10px solid #38AA56',
                      paddingLeft: '10px',
                      marginBottom: 16
                    }}
                    col="1"
                  >
                    <Description term="Webhook">
                      <a>{setUrl} </a>
                      <CopyToClipboard
                        text={setUrl}
                        onCopy={() => {
                          notification.success({ message: '复制成功' });
                        }}
                      >
                        <Button size="small">复制</Button>
                      </CopyToClipboard>
                    </Description>
                    <Description term="Tag触发&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;">
                      <div style={{ display: 'flex' }}>
                        <div
                          style={{
                            paddingTop: '10px',
                            margin: '0 15px 0 -30px'
                          }}
                        >
                          <Icon type="question-circle-o" />
                        </div>
                        <Form onSubmit={this.handleMirrorSubmit}>
                          <FormItem>
                            {getFieldDecorator('deploy_mirror', {
                              initialValue: this.state.deploy_mirror,
                              rules: [
                                {
                                  required: true,
                                  message: '关键字不能为空'
                                }
                              ]
                            })(
                              <Input
                                style={{ width: 300 }}
                                placeholder="支持正则表达式,如:release-v.*"
                              />
                            )}
                            <Button
                              onClick={() => {
                                this.handleMirrorSubmit();
                              }}
                              style={{
                                marginLeft: 10
                              }}
                              size="small"
                            >
                              更新
                            </Button>
                            <p>
                              注意：表达式为空时更新事件的tag与当前组件镜像tag一致时触发，不为空时表达式匹配正确触发
                            </p>
                          </FormItem>
                        </Form>
                      </div>
                    </Description>
                  </DescriptionList>
                </div>
              )}
            </TabPane>
          )}
        </Tabs>
      </Card>
    );
  }
}
