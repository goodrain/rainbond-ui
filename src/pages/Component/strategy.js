/* eslint-disable react/prefer-stateless-function */
import { Card, Form, Input, Select, Button, AutoComplete, notification, Popover } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
      value.schedule = this.extractText(value.schedule)
      addRunStrategy({
        team_name: teamName,
        service_alias: service_alias,
        ...value,
      }).then(res => {
        notification.success({
          message: formatMessage({ id: 'notification.success.data_save' })
        });
        this.handleRunStrategy()
      })
        .catch(err => {
          handleAPIError(err);
        });
    });
  }
  // 截取运行规则口号前的内容
  extractText = (selectValue) => {
    // 判断是否包含括号
    if (selectValue.includes('(')) {
        // 使用正则表达式提取括号前的内容
        return selectValue.split(/\s*\(.*?\)\s*/)[0].trim();
    }
    return selectValue.trim();
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

  //输入框限制
  handleCheckPort = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const float = /\D/g;
    if (value.match(float)) {
      callback(<FormattedMessage id='componentOverview.body.Strategy.Floating' />);
    }
    callback();
  };
  render() {
    const {
      form: { getFieldDecorator },
      extend_method
    } = this.props;
    const { data, scheduleValue } = this.state
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
      { name: formatMessage({ id: 'componentOverview.body.Strategy.hour' }), value: '0 * * * *' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.day' }), value: '0 0 * * *' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.week' }), value: '0 0 * * 0' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.month' }), value: '0 0 1 * *' },
      { name: formatMessage({ id: 'componentOverview.body.Strategy.year' }), value: '0 0 1 1 *' }
    ]
    return (
      <div style={{ marginBottom: '24px' }}>
        <Card title={<FormattedMessage id='componentOverview.body.Strategy.run' />}>
          <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            {extend_method === 'cronjob' &&
              <div >
                <Form.Item label={<FormattedMessage id='componentOverview.body.Strategy.rule' />}>
                  {getFieldDecorator('schedule', {
                    initialValue: data?.schedule || '',
                    rules: [
                      {
                        required: true,
                        message: formatMessage({ id: 'componentOverview.body.Strategy.not_null' }),
                      }
                    ]
                  })(
                    <AutoComplete defaultValue={data.schedule || ''}>
                      {arrOption.length > 0 &&  arrOption.map((item) => {
                          return <AutoComplete.Option value={item.value}>
                            {item.name}
                          </AutoComplete.Option>
                        })
                       }
                    </AutoComplete>
                  )}
                </Form.Item>
                <Popover
                  content={<div style={{
                    padding: '4px 8px',
                    height: 'auto',
                    fontSize: '12px',
                    color: '#757575'
                  }}><FormattedMessage id='componentOverview.body.Strategy.timing' /></div>}
                  placement="right"
                  trigger="hover">
                  <QuestionCircleOutlined
                    style={{
                      marginLeft: '10px',
                      fontSize: '14px',
                      position: 'absolute',
                      left: '34%',
                      top: '30%'
                    }}
                  />
                </Popover>
              </div>
            }

            <div >
              <Form.Item label={<FormattedMessage id='componentOverview.body.Strategy.max' />}>
                {getFieldDecorator('backoff_limit', {
                  initialValue: data.backoff_limit || '',
                  rules: [
                    {
                      required: false,
                      message: formatMessage({ id: 'componentOverview.body.Strategy.not_null' }),
                    },
                    {
                      max: 20, message: formatMessage({ id: 'componentOverview.body.Strategy.length' }),
                    },
                    { validator: this.handleCheckPort }

                  ]
                })(<Input type="number" placeholder={formatMessage({ id: 'componentOverview.body.Strategy.input_max' })} />)}
              </Form.Item>
              <Popover
                content={<div style={{
                  padding: '4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}><FormattedMessage id='componentOverview.body.Strategy.fail' /></div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined
                  style={{
                    marginLeft: '10px',
                    fontSize: '14px',
                    position: 'absolute',
                    left: '34%',
                    top: '30%'
                  }}
                />
              </Popover>
            </div>

            <div >
              <Form.Item label={<FormattedMessage id='componentOverview.body.Strategy.number' />}>
                {getFieldDecorator('parallelism', {
                  initialValue: data.parallelism || '',
                  rules: [
                    {
                      required: false,
                      message: formatMessage({ id: 'componentOverview.body.Strategy.not_null' }),
                    },
                    {
                      max: 20, message: formatMessage({ id: 'componentOverview.body.Strategy.length' }),
                    },
                    { validator: this.handleCheckPort }
                  ]
                })(<Input type="number" placeholder={formatMessage({ id: 'componentOverview.body.Strategy.input_number' })} />)}
              </Form.Item>
              <Popover
                content={<div style={{
                  padding: '4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}><FormattedMessage id='componentOverview.body.Strategy.pod_onetime' /></div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined
                  style={{
                    marginLeft: '10px',
                    fontSize: '14px',
                    position: 'absolute',
                    left: '34%',
                    top: '30%'
                  }}
                />
              </Popover>
            </div>

            <div >
              <Form.Item label={<FormattedMessage id='componentOverview.body.Strategy.max_time' />}>
                {getFieldDecorator('active_deadline_seconds', {
                  initialValue: data.active_deadline_seconds || '',
                  rules: [
                    {
                      required: false,
                      message: formatMessage({ id: 'componentOverview.body.Strategy.not_null' }),
                    },
                    {
                      max: 20, message: formatMessage({ id: 'componentOverview.body.Strategy.length' }),
                    },
                    { validator: this.handleCheckPort }
                  ]
                })(<Input type="number" placeholder={formatMessage({ id: 'componentOverview.body.Strategy.Run_time' })} />)}
              </Form.Item>
              <Popover
                content={<div style={{
                  padding: '4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}><FormattedMessage id='componentOverview.body.Strategy.job' /></div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined
                  style={{
                    marginLeft: '10px',
                    fontSize: '14px',
                    position: 'absolute',
                    left: '34%',
                    top: '30%'
                  }}
                />
              </Popover>
            </div>

            <div >
              <Form.Item label={<FormattedMessage id='componentOverview.body.Strategy.completions' />}>
                {getFieldDecorator('completions', {
                  initialValue: data.completions || '',
                  rules: [
                    {
                      required: false,
                      message: formatMessage({ id: 'componentOverview.body.Strategy.not_null' }),
                    },
                    {
                      max: 20, message: formatMessage({ id: 'componentOverview.body.Strategy.length' }),
                    },
                    { validator: this.handleCheckPort }
                  ]
                })(<Input type="number" placeholder={formatMessage({ id: 'componentOverview.body.Strategy.input_completions' })} />)}
              </Form.Item>
              <Popover
                content={<div style={{
                  padding: '4px 8px',
                  height: 'auto',
                  fontSize: '12px',
                  color: '#757575'
                }}><FormattedMessage id='componentOverview.body.Strategy.pod' /></div>}
                placement="right"
                trigger="hover">
                <QuestionCircleOutlined
                  style={{
                    marginLeft: '10px',
                    fontSize: '14px',
                    position: 'absolute',
                    left: '34%',
                    top: '30%'
                  }}
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
                <FormattedMessage id='componentOverview.body.Strategy.save' />
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }
}

export default Index;
