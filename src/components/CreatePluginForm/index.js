import MemoryForm from '@/components/MemoryForm';
import { Button, Checkbox, Col, Form, Input, Radio, Row, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import ShowRegionKey from '../ShowRegionKey';

const RadioGroup = Radio.Group;
const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 9
  },
  wrapperCol: {
    span: 15
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
      return callback( formatMessage({id:'teamPlugin.create.pages.null'}));
    }
    if (buildSource === 'image') {
      if (!value) {
        callback(formatMessage({id:'teamPlugin.create.pages.input_add'}));
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
        callback(formatMessage({id:'teamPlugin.create.pages.input_git'}));
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
        callback(formatMessage({id:'teamPlugin.create.pages.input'}));
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
                {formatMessage({id:'teamPlugin.create.pages.key'})}
              </Checkbox>
            )}
            <Checkbox value="showUsernameAndPass">
              {formatMessage({id:'teamPlugin.create.pages.btn'})}
            </Checkbox>
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
      submitText = formatMessage({id:'teamPlugin.create.title'}),
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
        <Form.Item {...formItemLayout} label={formatMessage({id:'teamPlugin.create.lable.plugin_alias'})}>
          {getFieldDecorator('plugin_alias', {
            initialValue: data.plugin_alias || '',
            rules: [
              { required: true, message: formatMessage({id:'placeholder.plugin.plugin_alias'}) },
              {
                max: 32,
                message: formatMessage({id:'placeholder.max32'})
              }
            ]
          })(
            <Input
              disabled={allDisabled}
              placeholder={formatMessage({id:'placeholder.plugin.plugin_aliasMsg'})}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'teamPlugin.create.lable.build_source'})}>
          {getFieldDecorator('build_source', {
            initialValue: data.build_source || defaultType,
            rules: [{ required: true, message: formatMessage({id:'placeholder.plugin.build_source'}) }]
          })(
            <RadioGroup disabled={allDisabled || isEdit}>
              <Radio value="image">
              {formatMessage({id:'teamPlugin.create.pages.image'})}
              </Radio>
              <Radio value="dockerfile">
              {formatMessage({id:'teamPlugin.create.pages.dockerfile'})}
              </Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={formatMessage({id:'teamPlugin.create.lable.category'})}>
          {getFieldDecorator('category', {
            initialValue: data.category || 'net-plugin:up',
            rules: [{ required: true, message: formatMessage({id:'placeholder.plugin.build_source'}) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              disabled={allDisabled || isEdit}
              placeholder={formatMessage({id:'placeholder.plugin.category'})}
            >
              <Option value="analyst-plugin:perf">
              {formatMessage({id:'teamPlugin.create.pages.performance'})}
              </Option>
              <Option value="init-plugin">
              {formatMessage({id:'teamPlugin.create.pages.initialize'})}
              </Option>
              <Option value="general-plugin">
              {formatMessage({id:'teamPlugin.create.pages.ordinary'})}
              </Option>
            </Select>
          )}
        </Form.Item>
        <Form.Item
          style={{ display: type === 'image' ? '' : 'none' }}
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.image'})}
        >
          {getFieldDecorator('image', {
            initialValue: data.image || '',
            rules: [{ validator: this.checkCmd }]
          })(<Input placeholder={formatMessage({id:'placeholder.plugin.image'})} />)}
        </Form.Item>
        <Form.Item
          style={{ display: type === 'dockerfile' ? '' : 'none' }}
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.code_repo'})}
        >
          {getFieldDecorator('code_repo', {
            initialValue: data.code_repo || '',
            rules: [{ validator: this.checkCode }]
          })(
            <Input placeholder={formatMessage({id:'placeholder.plugin.code_repo'})} />
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
          label={formatMessage({id:'teamPlugin.create.lable.username'})}
        >
          {getFieldDecorator('username', {
            initialValue: data.username || '',
            rules: [{ required: false, message: formatMessage({id:'placeholder.user_name'}) }]
          })(<Input autoComplete="off" placeholder={formatMessage({id:'placeholder.user_name'})} />)}
        </Form.Item>
        <Form.Item
          style={{ display: showUsernameAndPass ? '' : 'none' }}
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.password'})}
        >
          {getFieldDecorator('password', {
            initialValue: data.password || '',
            rules: [{ required: false, message: formatMessage({id:'placeholder.password'}) }]
          })(
            <Input
              autoComplete="new-password"
              type="password"
              placeholder={formatMessage({id:'placeholder.password'})}
            />
          )}
        </Form.Item>
        <Form.Item
          style={{ display: type === 'dockerfile' ? '' : 'none' }}
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.code_version'})}
        >
          {getFieldDecorator('code_version', {
            initialValue: data.code_version || 'master',
            rules: [{ validator: this.checkCodeVersion }]
          })(<Input disabled={allDisabled} placeholder={formatMessage({id:'placeholder.code_version'})} />)}
        </Form.Item>
        <MemoryForm
          {...formItemLayout}
          setkey="min_memory"
          form={form}
          FormItem={Form.Item}
          initialValue={data.min_memory}
          disabled={allDisabled}
          labelName={formatMessage({id:'placeholder.plugin.labelName'})}
          message={formatMessage({id:'placeholder.plugin.message'})}
          getFieldDecorator={getFieldDecorator}
        />
        <Form.Item {...formItemLayout} label={formatMessage({id:'teamPlugin.create.lable.min_cpu'})}>
          {getFieldDecorator('min_cpu', {
            initialValue: data.min_cpu || 0,
            rules: [
              {
                required: true,
                message: formatMessage({id:'placeholder.plugin.min_cpu'})
              },
              {
                pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                message: formatMessage({id:'placeholder.plugin.min_cpuMsg'})
              }
            ]
          })(
            <Input
              type="number"
              min={0}
              addonAfter="m"
              placeholder={formatMessage({id:'placeholder.plugin.min_cpu'})}
            />
          )}
          <div style={{ color: '#999999', fontSize: '12px' }}>
          {formatMessage({id:'teamPlugin.create.pages.cpu'})}
          </div>
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.build_cmd'})}
        >
          {getFieldDecorator('build_cmd', {
            initialValue: data.build_cmd || '',
            rules: [{ required: false, message: formatMessage({id:'placeholder.plugin.build_cmd'}) }]
          })(
            <Input disabled={allDisabled} placeholder={formatMessage({id:'placeholder.plugin.build_cmd'})}/>
          )}
        </Form.Item>
        <Form.Item
          style={{ display: isEdit ? '' : 'none' }}
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.update_info'})}
        >
          {getFieldDecorator('update_info', {
            initialValue: data.update_info || data.desc || '',
            rules: [{ required: false, message: formatMessage({id:'placeholder.plugin.update_info'}) }]
          })(<Input disabled={allDisabled} placeholder={formatMessage({id:'placeholder.plugin.update_info'})} />)}
        </Form.Item>
        <Form.Item
          style={{ display: !isEdit ? '' : 'none' }}
          {...formItemLayout}
          label={formatMessage({id:'teamPlugin.create.lable.desc'})}
        >
          {getFieldDecorator('desc', {
            initialValue: data.desc || '',
            rules: [
              { required: true, message: formatMessage({id:'placeholder.plugin.desc'}) },
              {
                max: 255,
                message: formatMessage({id:'placeholder.max255'})
              }
            ]
          })(<Input disabled={allDisabled} placeholder={formatMessage({id:'placeholder.plugin.desc'})} />)}
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
