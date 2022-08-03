/* eslint-disable react/prefer-stateless-function */
import { Card, Form, Input, Select, Button, AutoComplete, notification, Popover } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { addRunStrategy, getRunStrategy } from '../../services/app';
import globalUtil from '../../utils/global'
const { Option } = Select;
@Form.create()
@connect()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      scheduleFlag: false,
      scheduleValue: ''
    }
  }
  componentDidMount() {
    this.handleRunStrategy()
  }


  handleSubmit = (e) => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    const { scheduleValue } = this.state
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    form.validateFields((err, value) => {
      if (err) return;
      addRunStrategy({
        team_name: teamName,
        service_alias: service_alias,
        ...value,
        scheduleValue: scheduleValue
      }).then(res => {
        notification.success({
          message: '数据保存成功'
        });
        this.handleRunStrategy()
      })
        .catch(err => {
          handleAPIError(err);
        });
    });
  }
  handleRunStrategy = () => {
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    getRunStrategy({
      team_name: teamName,
      service_alias: service_alias
    }).then(res => {
      this.setState({
        data: res.bean
      })
    })
      .catch(err => {
        handleAPIError(err);
      });
  }
  handleAutoComplete = (value) => {
    if (value.indexOf('(') > -1) {
      const index = value.indexOf('(')
      const str = value.substring(0, index)
      this.setState({
        scheduleValue: str,
        scheduleFlag: true
      })
    } else {
      this.setState({
        scheduleValue: value,
        scheduleFlag: false
      })
    }
  }
  //输入框限制
  handleCheckPort = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const patt = /^\d{20}$/g;
    const float = /\D/g;
    if (value < 1) {
      callback('请输入正整数');
      return;
    } else if (value.match(patt)) {
      callback('长度要小于20位');
    } else if (value.match(float)) {
      callback('禁止输入小数点');
    }
    callback();
  };
  render() {
    const {
      form: { getFieldDecorator },
      extend_method
    } = this.props;
    const { data, scheduleValue, scheduleFlag } = this.state
    const formItemLayout = {
      labelCol: {
        xs: { span: 3 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 5 },
        sm: { span: 5 }
      }
    };
    const arrOption = [
      { name: '0 * * * * (每小时执行)', value: '0 * * * *' },
      { name: '0 0 * * * (每天执行)', value: '0 0 * * *' },
      { name: '0 0 * * 0 (每周执行)', value: '0 0 * * 0' },
      { name: '0 0 1 * * (每月执行)', value: '0 0 1 * *' },
      { name: '0 0 1 1 * (每年执行)', value: '0 0 1 1 *' }
    ]
    return (
      <div style={{ marginBottom: '24px' }}>
        <Card title="任务运行策略" key={scheduleValue}>
          <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            {extend_method === 'cronjob' &&
            <div style={{position:'relative'}}>
              <Form.Item label="运行规则">
                {getFieldDecorator('schedule', {
                  initialValue: data.schedule || '',
                  rules: [
                    {
                      required: true,
                      message: '不能为空'
                    }
                  ]
                })(
                    <AutoComplete onChange={this.handleAutoComplete}>
                      {arrOption.length
                        ? arrOption.map((item) => {
                          const res = (
                            <AutoComplete.Option value={item.value}>
                              {item.name}
                            </AutoComplete.Option>
                          );
                          return res;
                        })
                        : null}
                    </AutoComplete>
                )}
              </Form.Item>
              <Popover
                content={<div style={{
                  padding:'4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}>定时配置必填，如 */1 * * * * 一分钟执行一次</div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined 
                  style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px', 
                    position:'absolute', 
                    left:'34%', 
                    top:'30%' }} 
                />
              </Popover>
              </div>
            }

            <div style={{position:'relative'}}>
            <Form.Item label="最大重试次数">
              {getFieldDecorator('backoff_limit', {
                initialValue: data.backoff_limit || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  },
                  { validator: this.handleCheckPort }
                ]
              })(<Input type="number" placeholder="请输入最大重试次数" />)}
            </Form.Item>
            <Popover
                content={<div style={{
                  padding:'4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}>如果任务失败，默认失败认定重启次数为6，可以通过配置调整失败重启次数</div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined 
                  style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px', 
                    position:'absolute', 
                    left:'34%', 
                    top:'30%' }} 
                />
              </Popover>
            </div>

            <div style={{position:'relative'}}>
            <Form.Item label="并行任务数">
              {getFieldDecorator('parallelism', {
                initialValue: data.parallelism || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  },
                  { validator: this.handleCheckPort }
                ]
              })(<Input type="number" placeholder="请输入并行任务数" />)}
            </Form.Item>
            <Popover
                content={<div style={{
                  padding:'4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}>能够同时运行的Pod数</div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined 
                  style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px', 
                    position:'absolute', 
                    left:'34%', 
                    top:'30%' }} 
                />
              </Popover>
            </div>

            <div style={{position:'relative'}}>
            <Form.Item label="最大运行时间">
              {getFieldDecorator('active_deadline_seconds', {
                initialValue: data.active_deadline_seconds || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  },
                  { validator: this.handleCheckPort }
                ]
              })(<Input type="number" placeholder="请输入最大运行时间" />)}
            </Form.Item>
            <Popover
                content={<div style={{
                  padding:'4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}>如果Job运行的时间超过了设定的秒数，那么此Job就自动停止运行所有的Pod</div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined 
                  style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px', 
                    position:'absolute', 
                    left:'34%', 
                    top:'30%' }} 
                />
              </Popover>
            </div>

            <div style={{position:'relative'}}>
            <Form.Item label="完成数">
              {getFieldDecorator('completions', {
                initialValue: data.completions || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  },
                  { validator: this.handleCheckPort }
                ]
              })(<Input type="number" placeholder="请输入完成数" />)}
            </Form.Item>
            <Popover
                content={<div style={{
                  padding:'4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}>完成该Job需要执行成功的Pod数</div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined 
                  style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px', 
                    position:'absolute', 
                    left:'34%', 
                    top:'30%' }} 
                />
              </Popover>
            </div>

            <Form.Item
              wrapperCol={{
                xs: {
                  span: 3,
                  offset: 3
                },
                sm: {
                  span: 3,
                  offset: 3
                }
              }}
            >
              <Button type="primary" htmlType="submit">
                点击保存
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }
}

export default Index;
