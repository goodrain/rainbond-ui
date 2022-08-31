/* eslint-disable react/jsx-no-target-blank */
import { Button, Form, Input, Modal, Select, Tag } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import configureGlobal from '../../utils/configureGlobal';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 9
  },
  wrapperCol: {
    span: 15
  }
};

@connect(
  ({ global, loading }) => ({
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
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
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
      title: formatMessage({id: 'teamAdd.create.code.demoBtn'}),
      content: (
        <div>
          <Tag color="magenta" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#EA2E96' }}
              href={`${configureGlobal.documentAddress}demo-2048.git`}
            >
              {formatMessage({id: 'teamAdd.create.code.demoBtn'})}
            </a>
          </Tag>
          <Tag color="green" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#74CC49' }}
              href={`${configureGlobal.documentAddress}static-demo.git`}
            >
              {formatMessage({id: 'teamAdd.create.code.demoBtn'})}
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

  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id:'placeholder.k8s_component_name'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(
            formatMessage({id: 'placeholder.nameSpaceReg'})
          )
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id: 'placeholder.max32'})));
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { groups, createAppByCodeLoading, rainbondInfo } = this.props;
    const data = this.props.data || {};
    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
          {getFieldDecorator('group_id', {
            initialValue: data.groupd_id ? data.groupd_id : undefined,
            rules: [{ required: true, message: formatMessage({id: 'placeholder.select'}) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={formatMessage({id: 'placeholder.appName'})}
              style={{ display: 'inline-block', width: 276, marginRight: 10 }}
            >
              {(groups || []).map(group => (
                <Option key={group.group_id} value={group.group_id}>
                  {group.group_name}
                </Option>
              ))}
            </Select>
          )}
          <Button onClick={this.onAddGroup}>{formatMessage({id: 'teamApply.createApp'})}</Button>
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.service_cname'})}>
          {getFieldDecorator('service_cname', {
            initialValue: data.service_cname || '',
            rules: [
              { required: true, message: formatMessage({id: 'placeholder.service_cname'}) },
              {
                max: 24,
                message: formatMessage({id: 'placeholder.max24'})
              }
            ]
          })(
            <Input
              // style={{ width: 292 }}
              placeholder={formatMessage({id: 'placeholder.service_cname'})}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.k8s_component_name'})}>
          {getFieldDecorator('k8s_component_name', {
            rules: [
              {
                required: true,
                validator: this.handleValiateNameSpace
              }
            ]
          })(<Input placeholder={formatMessage({id: 'placeholder.k8s_component_name'})}  />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<span>Demo</span>}>
          {getFieldDecorator('git_url', {
            initialValue:
              data.git_url || configureGlobal.documentAddressDefault,
            rules: [{ required: true, message: formatMessage({id: 'placeholder.select'})  }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              style={{ display: 'inline-block', width: 290, marginRight: 10 }}
              onChange={this.handleChangeDemo}
            >
              <Option value={`${configureGlobal.documentAddress}demo-2048.git`}>
                {formatMessage({id: 'teamAdd.create.code.demo2048'})}
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}static-demo.git`}
              >
                {formatMessage({id: 'teamAdd.create.code.demoStatic'})}
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
                {formatMessage({id: 'teamAdd.create.code.href'})}
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
            {formatMessage({id: 'teamAdd.create.btn.create'})}
          </Button>
        </Form.Item>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Form>
    );
  }
}
