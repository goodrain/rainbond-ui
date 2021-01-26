/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Card, Form, Input, Modal, Radio } from 'antd';
import { connect } from 'dva';
import React from 'react';
import appProbeUtil from '../../utils/appProbe-util';
import globalUtil from '../../utils/global';
import EditHealthCheck from './setting/edit-health-check';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    innerEnvs: appControl.innerEnvs,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    appDetail: appControl.appDetail,
    teamControl,
    appControl
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      healthList: null,
      showHealth: false,
      isScheme: '',
      list: []
    };
  }
  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.fetchStartProbe();
    this.fetchPorts();
    this.fetchBaseInfo();
    this.fetchTags();
  }
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  fetchPorts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: () => {}
    });
  };
  fetchTags = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchTags',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: () => {}
    });
  };

  fetchStartProbe() {
    this.props.dispatch({
      type: 'appControl/fetchStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  }

  handleSubmit = vals => {
    this.props.dispatch({
      type: 'appControl/addStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...vals
      },
      callback: () => {
        this.handleCancel();
        this.fetchStartProbe();
      }
    });
  };

  handleSubmitEdit = vals => {
    const { startProbe } = this.props;
    this.props.dispatch({
      type: 'appControl/editStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...vals,
        old_mode: startProbe.mode
      },
      callback: () => {
        this.handleCancel();
        this.fetchStartProbe();
      }
    });
  };

  handleCancel = () => {
    this.setState({ showHealth: false });
  };
  openCancel = () => {
    this.setState({ showHealth: true });
  };

  onChange = e => {
    this.props.form.setFieldsValue({
      attr_value: e.target.value
    });
    this.setState({ isScheme: e.target.value });
  };
  onChanges = e => {
    this.props.form.setFieldsValue({
      action: e.target.value
    });
  };
  handleState = () => {
    const arr = this.state.list || [{ status: '-' }];
    let healthy = 0;
    let unhealthy = 0;
    let Unknown = 0;
    let nos = '';
    arr.map(item => {
      const { status } = item;
      if (status == 'healthy') {
        healthy++;
      } else if (status == 'unhealthy') {
        unhealthy++;
      } else if (status == 'Unknown' || status == 'unknown') {
        Unknown++;
      } else {
        nos = '-';
      }
      return item;
    });
    if (
      healthy != 0 &&
      unhealthy == 0 &&
      Unknown === 0 &&
      Unknown === 0 &&
      nos == ''
    ) {
      return (
        <span>
          (<span style={{ color: 'green' }}>健康</span>)
        </span>
      );
    } else if (healthy != 0 && (unhealthy != 0 || Unknown != 0)) {
      return (
        <span>
          (<span style={{ color: 'green' }}>部分健康</span>)
        </span>
      );
    } else if (healthy == 0 && unhealthy != 0 && Unknown == 0 && nos == '') {
      return (
        <span>
          (<span style={{ color: 'red' }}>不健康</span>)
        </span>
      );
    } else if (healthy == 0 && unhealthy == 0 && Unknown != 0 && nos == '') {
      return '(未知)';
    }
    return '(-)';
  };

  handleStartProbeStart = isUsed => {
    const { startProbe } = this.props;
    this.props.dispatch({
      type: 'appControl/editStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...startProbe,
        is_used: isUsed
      },
      callback: () => {
        this.fetchStartProbe();
      }
    });
  };

  handleStates = data => {
    if (appProbeUtil.isStartProbeUsed(data)) {
      if (appProbeUtil.isStartProbeStart(data)) {
        return '已启用';
      }
      return '已禁用';
    }
    return '未设置';
  };
  render() {
    const { baseInfo, startProbe, ports } = this.props;
    if (typeof baseInfo.build_upgrade !== 'boolean') {
      return null;
    }
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const { healthList, showHealth, isScheme, list } = this.state;
    return (
      <div>
        {startProbe && (
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                健康检测
                <div>
                  {startProbe && (
                    <a
                      style={{
                        marginRight: '5px',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                      onClick={() => {
                        this.openCancel();
                      }}
                    >
                      {JSON.stringify(startProbe) != '{}' ? '编辑' : '设置'}
                    </a>
                  )}
                  {JSON.stringify(startProbe) != '{}' &&
                  appProbeUtil.isStartProbeStart(startProbe) ? (
                    <a
                      onClick={() => {
                        this.handleStartProbeStart(false);
                      }}
                      style={{
                        marginRight: '5px',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                      href="javascript:;"
                    >
                      禁用
                    </a>
                  ) : (
                    JSON.stringify(startProbe) != '{}' && (
                      <a
                        onClick={() => {
                          this.handleStartProbeStart(true);
                        }}
                        style={{
                          marginRight: '5px',
                          fontSize: '14px',
                          fontWeight: 400
                        }}
                        href="javascript:;"
                      >
                        启用
                      </a>
                    )
                  )}
                </div>
              </div>
            }
          >
            {startProbe && (
              <div style={{ display: 'flex' }}>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  当前状态:{this.handleState()}
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  检测方式:{startProbe.scheme ? startProbe.scheme : '未设置'}
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  不健康处理方式:
                  {startProbe.mode == 'readiness'
                    ? '下线'
                    : startProbe.mode == 'liveness'
                    ? '重启'
                    : startProbe.mode == 'ignore'
                    ? '忽略'
                    : '未设置'}
                </div>
              </div>
            )}
          </Card>
        )}
        {showHealth && (
          <Modal
            title="编辑健康检测"
            onOk={() => {
              this.handleSubmit();
            }}
            onCancel={this.handleCancel}
            visible={showHealth}
          >
            {healthList && (
              <Form onSubmit={this.handleSubmit}>
                <FormItem {...formItemLayout} label="检测方式">
                  {getFieldDecorator('Scheme', {
                    initialValue: healthList.Scheme || '',
                    rules: [{ required: true, message: '请输入检测方式' }]
                  })(
                    <RadioGroup onChange={this.onChange}>
                      <Radio value="HTTP">HTTP</Radio>
                      <Radio value="TCP">TCP</Radio>
                    </RadioGroup>
                  )}
                </FormItem>
                <FormItem {...formItemLayout} label="检测端口">
                  {getFieldDecorator('port', {
                    initialValue: healthList.port || '',
                    rules: [{ required: true, message: '请输入检测端口' }]
                  })(
                    <Input placeholder="请输入端口" style={{ width: '90%' }} />
                  )}
                </FormItem>
                <FormItem {...formItemLayout} label="不健康处理方式:">
                  {getFieldDecorator('action', {
                    initialValue: healthList.action || '',
                    rules: [{ required: true, message: '请选择' }]
                  })(
                    <RadioGroup onChange={this.onChanges}>
                      <Radio value="offline">下线</Radio>
                      <Radio value="ignore">忽略</Radio>
                    </RadioGroup>
                  )}
                </FormItem>
                {isScheme == 'HTTP' && (
                  <FormItem {...formItemLayout} label="URI">
                    {getFieldDecorator('path', {
                      initialValue: healthList.path || ''
                    })(
                      <Input placeholder="请输入URI" style={{ width: '90%' }} />
                    )}
                  </FormItem>
                )}
                <FormItem {...formItemLayout} label="检测间隔时间">
                  {getFieldDecorator('time_interval', {
                    initialValue: healthList.time_interval || ''
                  })(
                    <Input
                      type="number"
                      style={{ width: '90%' }}
                      placeholder="请输入间隔时间"
                    />
                  )}
                  <span style={{ marginLeft: 8 }}> 秒</span>
                </FormItem>

                <FormItem {...formItemLayout} label="允许错误次数">
                  {getFieldDecorator('max_error_num', {
                    initialValue: healthList.max_error_num || ''
                  })(
                    <Input
                      type="number"
                      style={{ width: '90%' }}
                      placeholder="请输入允许错误次数"
                    />
                  )}
                  <span style={{ marginLeft: 8 }}> 秒</span>
                </FormItem>
              </Form>
            )}
          </Modal>
        )}
        {this.state.showHealth && (
          <EditHealthCheck
            ports={ports}
            onOk={this.handleSubmitEdit}
            title="健康检测"
            data={startProbe}
            onCancel={this.handleCancel}
            types="third"
          />
        )}
      </div>
    );
  }
}
