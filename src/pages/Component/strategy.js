/* eslint-disable react/prefer-stateless-function */
import { Card, Form, Input, Select, Button, AutoComplete, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { addRunStrategy, getRunStrategy } from '../../services/app';
import globalUtil from '../../utils/global'
const { Option } = Select;
@Form.create()
@connect()
class Index extends PureComponent {
  constructor(props){
    super(props);
    this.state = {
      data:{}
    }
  }
  componentDidMount(){
    this.handleRunStrategy()
  }


  handleSubmit = (e) => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    form.validateFields((err, value) => {
      if (err) return;
      addRunStrategy({
        team_name: teamName,
        service_alias: service_alias,
        ...value
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
  render() {
    const {
      form: { getFieldDecorator },
      extend_method
    } = this.props;
    const { data } = this.state
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
    const arrOption = ['0 * * * *','0 0 * * *','0 0 * * 0','0 0 1 * *','0 0 1 1 *']
    return (
      <div style={{ marginBottom: '24px' }}>
        <Card title="任务运行策略">
          <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            {extend_method === 'cronjob' &&
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
                  <AutoComplete>
                    {arrOption.length
                      ? arrOption.map((item) => {
                          const res = (
                            <AutoComplete.Option value={item}>
                              {item}
                            </AutoComplete.Option>
                          );
                          return res;
                        })
                      : null}
                  </AutoComplete>
                )}
              </Form.Item>
            }
            <Form.Item label="最大重试次数">
            {getFieldDecorator('backoff_limit', {
              initialValue: data.backoff_limit || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
            <Form.Item label="并行任务数">
              {getFieldDecorator('parallelism', {
                initialValue: data.parallelism || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
            <Form.Item label="最大运行时间">
              {getFieldDecorator('active_deadline_seconds', {
                initialValue: data.active_deadline_seconds || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
            <Form.Item label="完成数">
              {getFieldDecorator('completions', {
                initialValue: data.completions || '',
                rules: [
                  {
                    required: false,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
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
