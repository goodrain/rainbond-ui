import MemoryForm from '@/components/MemoryForm';
import { Button, Checkbox, Col, Form, Input, Radio, Row, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import ShowRegionKey from '../ShowRegionKey';

const RadioGroup = Radio.Group;
const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect()
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { data } = this.props;
    this.state = {
      visibleKey: false,
      showUsernameAndPass: !!(data && data.username),
      checkedList: data && data.username ? ['showUsernameAndPass'] : []
    };
  }

  onChange = checkedValues => {
    this.setState({
      checkedList: checkedValues,
      showUsernameAndPass: checkedValues.includes('showUsernameAndPass'),
      showKey: checkedValues.includes('showKey'),
      visibleKey: !this.state.showKey && checkedValues.includes('showKey')
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    const { checkedList } = this.state;
    form.validateFields({ force: true }, (err, fieldsValue) => {
      if (err) return;
      if (!checkedList.includes('showUsernameAndPass')) {
        fieldsValue.password = undefined;
        fieldsValue.username = undefined;
      }
      if (onSubmit) {
        fieldsValue.min_cpu = Number(fieldsValue.min_cpu);
        onSubmit(fieldsValue);
      }
    });
  };
  checkCmd = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const buildSource = getFieldValue('build_source');
    if (/\s/g.test(value)) {
      return callback('不能存在空格');
    }
    if (buildSource === 'image') {
      if (!value) {
        callback('请输入镜像地址（名称:tag）如nginx:1.11');
      } else {
        callback();
      }
    } else {
      callback();
    }
  };
  checkCode = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const buildSource = getFieldValue('build_source');
    if (buildSource === 'dockerfile') {
      if (!value) {
        callback('请输入源码Git地址（必须包含Dockerfile文件)');
        return;
      }
    }
    callback();
  };
  checkCodeVersion = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const buildSource = getFieldValue('build_source');
    if (buildSource === 'dockerfile') {
      if (!value) {
        callback('请输入代码版本');
        return;
      }
    }
    callback();
  };

  fetchCheckboxGroup = isShow => {
    const { checkedList, showKey } = this.state;
    return (
      <Checkbox.Group
        style={{ width: '100%', marginBottom: '10px' }}
        onChange={this.onChange}
        value={checkedList}
      >
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            {isShow && (
              <Checkbox value="showKey" checked={showKey}>
                配置授权Key
              </Checkbox>
            )}
            <Checkbox value="showUsernameAndPass">填写仓库账号密码</Checkbox>
          </Col>
        </Row>
      </Checkbox.Group>
    );
  };
  handleVisibleKey = () => {
    this.setState({ visibleKey: false });
  };
  hideShowKey = () => {
    this.handkeDeleteCheckedList('showKey');
    this.setState({ showKey: false, visibleKey: false });
  };
  handkeDeleteCheckedList = type => {
    const { checkedList } = this.state;
    const arr = checkedList;
    if (arr.indexOf(type) > -1) {
      arr.splice(arr.indexOf(type), 1);
      this.setState({ checkedList: arr });
    }
  };
  render() {
    const {
      data = {},
      form,
      Modifys = false,
      isEdit = false,
      allDisabled = false,
      submitText = '创建插件',
      isCreate
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const { showUsernameAndPass, visibleKey } = this.state;
    let type = getFieldValue('build_source');
    const defaultType = 'image';
    if (!type) {
      type = data.build_source || defaultType;
    }

    return (
      <Form layout="horizontal" hideRequiredMark onSubmit={this.handleSubmit}>
        <Form.Item {...formItemLayout} label="插件名称">
          {getFieldDecorator('plugin_alias', {
            initialValue: data.plugin_alias || '',
            rules: [
              { required: true, message: '要创建的插件还没有名字' },
              {
                max: 32,
                message: '最大长度32位'
              }
            ]
          })(
            <Input
              disabled={allDisabled}
              placeholder="请为创建的插件起个名字吧"
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="安装来源">
          {getFieldDecorator('build_source', {
            initialValue: data.build_source || defaultType,
            rules: [{ required: true, message: '请选择插件安装来源' }]
          })(
            <RadioGroup disabled={allDisabled || isEdit}>
              <Radio value="image">镜像</Radio>
              <Radio value="dockerfile">Dockerfile</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="插件类别">
          {getFieldDecorator('category', {
            initialValue: data.category || 'net-plugin:up',
            rules: [{ required: true, message: '请选择插件安装来源' }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              disabled={allDisabled || isEdit}
              placeholder="请选择类别"
            >
              <Option value="net-plugin:up">入口网络</Option>
              <Option value="net-plugin:down">出口网络</Option>
              <Option value="net-plugin:in-and-out">出口入口共治网络</Option>
              <Option value="analyst-plugin:perf">性能分析</Option>
              <Option value="init-plugin">初始化类型</Option>
              <Option value="general-plugin">一般类型</Option>
              <Option value="exporter-plugin">监控</Option>
            </Select>
          )}
        </Form.Item>
        <Form.Item
          style={{ display: type === 'image' ? '' : 'none' }}
          {...formItemLayout}
          label="镜像地址"
        >
          {getFieldDecorator('image', {
            initialValue: data.image || '',
            rules: [{ validator: this.checkCmd }]
          })(<Input placeholder="请输入镜像地址（名称:tag）如nginx:1.11" />)}
        </Form.Item>
        <Form.Item
          style={{ display: type === 'dockerfile' ? '' : 'none' }}
          {...formItemLayout}
          label="源码地址"
        >
          {getFieldDecorator('code_repo', {
            initialValue: data.code_repo || '',
            rules: [{ validator: this.checkCode }]
          })(
            <Input placeholder="请输入源码Git地址（必须包含Dockerfile文件）" />
          )}
        </Form.Item>
        {visibleKey && (
          <ShowRegionKey
            onCancel={this.hideShowKey}
            onOk={this.handleVisibleKey}
          />
        )}
        {this.fetchCheckboxGroup(type && type === 'dockerfile')}
        <Form.Item
          style={{ display: showUsernameAndPass ? '' : 'none' }}
          {...formItemLayout}
          label="仓库用户名"
        >
          {getFieldDecorator('username', {
            initialValue: data.username || '',
            rules: [{ required: false, message: '请输入仓库用户名' }]
          })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
        </Form.Item>
        <Form.Item
          style={{ display: showUsernameAndPass ? '' : 'none' }}
          {...formItemLayout}
          label="仓库密码"
        >
          {getFieldDecorator('password', {
            initialValue: data.password || '',
            rules: [{ required: false, message: '请输入仓库密码' }]
          })(
            <Input
              autoComplete="new-password"
              type="password"
              placeholder="请输入仓库密码"
            />
          )}
        </Form.Item>
        <Form.Item
          style={{ display: type === 'dockerfile' ? '' : 'none' }}
          {...formItemLayout}
          label="代码版本"
        >
          {getFieldDecorator('code_version', {
            initialValue: data.code_version || 'master',
            rules: [{ validator: this.checkCodeVersion }]
          })(<Input disabled={allDisabled} placeholder="请输入代码版本" />)}
        </Form.Item>
        <MemoryForm
          {...formItemLayout}
          setkey="min_memory"
          form={form}
          FormItem={Form.Item}
          initialValue={data.min_memory}
          disabled={allDisabled}
          labelName="最小内存"
          message="请选择最小内存"
          getFieldDecorator={getFieldDecorator}
        />
        <Form.Item {...formItemLayout} label="CPU">
          {getFieldDecorator('min_cpu', {
            initialValue: data.min_cpu || 0,
            rules: [
              {
                required: true,
                message: '请输入CPU'
              },
              {
                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                message: '只允许输入整数'
              }
            ]
          })(
            <Input
              type="number"
              min={0}
              addonAfter="m"
              placeholder="请输入CPU"
            />
          )}
          <div style={{ color: '#999999', fontSize: '12px' }}>
            CPU分配额0为不限制，1000m=1core。
          </div>
        </Form.Item>
        <Form.Item
          style={{ display: type === 'image' ? 'none' : '' }}
          {...formItemLayout}
          label="启动命令"
        >
          {getFieldDecorator('build_cmd', {
            initialValue: data.build_cmd || '',
            rules: [{ required: false, message: '请输入插件的启动命令' }]
          })(
            <Input disabled={allDisabled} placeholder="请输入插件的启动命令" />
          )}
        </Form.Item>
        <Form.Item
          style={{ display: isEdit ? '' : 'none' }}
          {...formItemLayout}
          label="更新说明"
        >
          {getFieldDecorator('update_info', {
            initialValue: data.update_info || data.desc || '',
            rules: [{ required: false, message: '请输入更新说明' }]
          })(<Input disabled={allDisabled} placeholder="请输入更新说明" />)}
        </Form.Item>
        <Form.Item
          style={{ display: !isEdit ? '' : 'none' }}
          {...formItemLayout}
          label="一句话说明"
        >
          {getFieldDecorator('desc', {
            initialValue: data.desc || '',
            rules: [
              { required: true, message: '请输入一句话说明' },
              {
                max: 255,
                message: '最大长度255位'
              }
            ]
          })(<Input disabled={allDisabled} placeholder="请输入一句话说明" />)}
        </Form.Item>
        {!allDisabled ? (
          <Row>
            <Col offset={5} span={19}>
              {Modifys ? (
                <div>
                  {isEdit && (
                    <Button onClick={this.handleSubmit} type="primary">
                      {submitText}
                    </Button>
                  )}
                </div>
              ) : (
                isCreate && (
                  <Button onClick={this.handleSubmit} type="primary">
                    {submitText}
                  </Button>
                )
              )}
            </Col>
          </Row>
        ) : null}
      </Form>
    );
  }
}
