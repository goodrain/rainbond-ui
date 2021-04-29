import { Button, Form, Input, Modal, Select, Tabs, Tag } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import AddGroup from '../../components/AddOrEditGroup';
import configureGlobal from '../../utils/configureGlobal';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';

const { Option, OptGroup } = Select;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};
const { TabPane } = Tabs;

@connect(
  ({ user, global, loading }) => ({
    groups: global.groups,
    createAppByCodeLoading: loading.effects['createApp/createAppByCode'],
    rainbondInfo: global.rainbondInfo
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      demoHref:
        this.props.data.git_url || configureGlobal.documentAddressDefault
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = e => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  handleAddGroup = vals => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: group => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };
  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };

  handleOpenDemo = () => {
    Modal.warning({
      title: '查看Dmeo源码',
      content: (
        <div>
          <Tag color="magenta" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#EA2E96' }}
              href={`${configureGlobal.documentAddress}demo-2048.git`}
            >
              2048小游戏
            </a>
          </Tag>
          <Tag color="green" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#74CC49' }}
              href={`${configureGlobal.documentAddress}static-demo.git`}
            >
              静态Web：hello world !
            </a>
          </Tag>
          <Tag color="volcano" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FA541B' }}
              href={`${configureGlobal.documentAddress}php-demo.git`}
            >
              PHP Demo
            </a>
          </Tag>
          <Tag color="blue" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#1990FF' }}
              href={`${configureGlobal.documentAddress}python-demo.git`}
            >
              Python Demo
            </a>
          </Tag>
          <Tag color="orange" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FA8E14' }}
              href={`${configureGlobal.documentAddress}nodejs-demo.git`}
            >
              Node.js Demo
            </a>
          </Tag>
          <Tag color="gold" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FCAD15' }}
              href={`${configureGlobal.documentAddress}go-demo.git`}
            >
              Golang Demo
            </a>
          </Tag>
          <Tag color="lime" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#A0D912' }}
              href={`${configureGlobal.documentAddress}java-maven-demo.git`}
            >
              Java-Maven Demo
            </a>
          </Tag>
          <Tag color="geekblue" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#3054EB' }}
              href={`${configureGlobal.documentAddress}java-jar-demo.git`}
            >
              Java-Jar Demo
            </a>
          </Tag>
          <Tag color="purple" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#722DD1' }}
              href={`${configureGlobal.documentAddress}java-war-demo.git`}
            >
              Java-War Demo
            </a>
          </Tag>
          <Tag color="volcano" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FA541B' }}
              href={`${configureGlobal.documentAddress}java-gradle-demo.git`}
            >
              Java-Gradle Demo
            </a>
          </Tag>
          <Tag color="gold" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FCAD15' }}
              href={`${configureGlobal.documentAddress}dotnet-demo.git`}
            >
              .NetCore Demo
            </a>
          </Tag>
        </div>
      )
    });
  };

  handleChangeDemo = value => {
    this.setState({
      demoHref: value
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups, createAppByCodeLoading, rainbondInfo } = this.props;
    const data = this.props.data || {};

    const HeartSvg = () => (
      <svg
        viewBox="64 64 896 896"
        data-icon="share-alt"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M752 664c-28.5 0-54.8 10-75.4 26.7L469.4 540.8a160.68 160.68 0 0 0 0-57.6l207.2-149.9C697.2 350 723.5 360 752 360c66.2 0 120-53.8 120-120s-53.8-120-120-120-120 53.8-120 120c0 11.6 1.6 22.7 4.7 33.3L439.9 415.8C410.7 377.1 364.3 352 312 352c-88.4 0-160 71.6-160 160s71.6 160 160 160c52.3 0 98.7-25.1 127.9-63.8l196.8 142.5c-3.1 10.6-4.7 21.8-4.7 33.3 0 66.2 53.8 120 120 120s120-53.8 120-120-53.8-120-120-120zm0-476c28.7 0 52 23.3 52 52s-23.3 52-52 52-52-23.3-52-52 23.3-52 52-52zM312 600c-48.5 0-88-39.5-88-88s39.5-88 88-88 88 39.5 88 88-39.5 88-88 88zm440 236c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z" />
      </svg>
    );
    // const HeartIcon = props => <Icon component={HeartSvg} {...props} />;

    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label="应用名称">
          {getFieldDecorator('group_id', {
            initialValue: data.groupd_id ? data.groupd_id : undefined,
            rules: [{ required: true, message: '请选择' }]
          })(
            <Select
              placeholder="请选择要所属应用"
              style={{ display: 'inline-block', width: 292, marginRight: 15 }}
            >
              {(groups || []).map(group => (
                <Option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </Option>
              ))}
            </Select>
          )}
          <Button onClick={this.onAddGroup}>新建应用</Button>
        </Form.Item>
        <Form.Item {...formItemLayout} label="组件名称">
          {getFieldDecorator('service_cname', {
            initialValue: data.service_cname || '',
            rules: [{ required: true, message: '要创建的组件还没有名字' }]
          })(
            <Input
              style={{ width: 292 }}
              placeholder="请为创建的组件起个名字吧"
            />
          )}
        </Form.Item>

        <Form.Item {...formItemLayout} label={<span>Demo</span>}>
          {getFieldDecorator('git_url', {
            initialValue:
              data.git_url || configureGlobal.documentAddressDefault,
            rules: [{ required: true, message: '请选择' }]
          })(
            <Select
              style={{ display: 'inline-block', width: 292, marginRight: 15 }}
              onChange={this.handleChangeDemo}
            >
              <Option value={`${configureGlobal.documentAddress}demo-2048.git`}>
                2048小游戏
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}static-demo.git`}
              >
                静态Web：hello world !
              </Option>
              <Option value={`${configureGlobal.documentAddress}php-demo.git`}>
                PHP Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}python-demo.git`}
              >
                Python Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}nodejs-demo.git`}
              >
                Node.js Demo
              </Option>
              <Option value={`${configureGlobal.documentAddress}go-demo.git`}>
                Golang Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-maven-demo.git`}
              >
                Java-Maven Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-jar-demo.git`}
              >
                Java-Jar Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-war-demo.git`}
              >
                Java-war Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-gradle-demo.git`}
              >
                Java-gradle Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}dotnet-demo.git`}
              >
                .NetCore Demo
              </Option>
            </Select>
          )}
          {this.state.demoHref &&
            rainbondUtil.documentPlatform_url(rainbondInfo) && (
              <a target="_blank" href={this.state.demoHref}>
                查看源码
              </a>
            )}
        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: {
              span: formItemLayout.wrapperCol.span,
              offset: formItemLayout.labelCol.span
            }
          }}
          label=""
        >
          <Button
            onClick={this.handleSubmit}
            type="primary"
            loading={createAppByCodeLoading}
          >
            确认创建
          </Button>
        </Form.Item>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Form>
    );
  }
}
