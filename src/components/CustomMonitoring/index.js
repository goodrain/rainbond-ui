/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
// eslint-disable-next-line react/no-multi-comp
import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Spin,
  Form,
  Input,
  Col,
  Alert,
  Button,
  AutoComplete
} from 'antd';
import styless from './index.less';
import RangeChart from '@/components/CustomChart/rangeChart';
import { start } from '@/services/app';

const FormItem = Form.Item;
@Form.create()
@connect(({ user, appControl, loading }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  addLoading: loading.effects['monitor/addServiceMonitorFigure'],
  editLoading: loading.effects['monitor/editServiceMonitorFigure']
}))
export default class CustomMonitoring extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      indicators: [],
      RangeData: this.props.info.graph_id ? [this.props.info] : [],
      loading: false
    };
  }
  componentDidMount() {
    this.fetchComponentMetrics();
  }
  fetchComponentMetrics = () => {
    const { dispatch, serviceId, teamName, appAlias } = this.props;
    dispatch({
      type: 'monitor/fetchComponentMetrics',
      payload: {
        team_name: teamName,
        service_alias: appAlias,
        serviceId
      },
      callback: (res) => {
        const arr = res.list.map((item) => item.metric);
        this.setState({
          indicators: arr
        });
      }
    });
  };

  onOk = (e) => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };
  handleSearch = () => {
    const { form } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err) {
        this.setState({
          RangeData: [vals]
        });
      }
    });
  };

  handleSubmitDelete = () => {
    this.cancalDelete();
  };
  render() {
    const {
      form,
      onCancel,
      dispatch,
      appDetail,
      appAlias,
      info = {},
      colSpan = 24,
      addLoading,
      editLoading
    } = this.props;
    const { getFieldDecorator } = form;
    const { loading, indicators, RangeData } = this.state;
    const parameter = {
      moduleName: 'CustomMonitor',
      start: new Date().getTime() / 1000 - 60 * 60,
      end: new Date().getTime() / 1000,
      dispatch,
      appDetail,
      appAlias
    };
    return (
      <Fragment>
        <Form onSubmit={this.onOk}>
          <Spin spinning={loading}>
            <Card
              className={styless.customCard}
              headStyle={{ padding: '0 24px' }}
              title={
                <FormItem>
                  {getFieldDecorator('title', {
                    initialValue: info.title || '',
                    rules: [
                      { required: true, message: '请填写标题' },
                      {
                        max: 64,
                        message: '最大长度64位'
                      }
                    ]
                  })(
                    <Input
                      style={{ width: 'calc(100% - 15px)' }}
                      placeholder="请填写标题"
                    />
                  )}
                </FormItem>
              }
              extra={
                <div>
                  <a style={{ marginRight: '5px' }} onClick={onCancel}>
                    取消
                  </a>
                  <a onClick={this.onOk} loading={addLoading || editLoading}>
                    {info.graph_id ? '保存' : '添加'}
                  </a>
                </div>
              }
            >
              <div>
                <Alert
                  style={{ marginBottom: '10px' }}
                  message="请输入 标准PromQL 语法进行查询显示图表"
                  type="info"
                  showIcon
                />
                <FormItem>
                  {getFieldDecorator('promql', {
                    initialValue: info.promql || '',
                    rules: [
                      { required: true, message: '请填写查询条件' },
                      {
                        max: 255,
                        message: '最大长度255位'
                      }
                    ]
                  })(
                    <AutoComplete
                      style={{
                        width: 'calc(100% - 75px)',
                        marginRight: '5px'
                      }}
                      dataSource={indicators}
                      filterOption={(inputValue, option) =>
                        option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                      }
                      placeholder="请填写查询条件"
                    >
                      {/* {indicators &&
                        indicators.length > 0 &&
                        indicators.map((item, index) => {
                          const { metric } = item;
                          return (
                            <AutoComplete.Option
                              key={`metric${index}`}
                              value={metric}
                            >
                              {metric}
                            </AutoComplete.Option>
                          );
                        })} */}
                    </AutoComplete>
                  )}
                  <Button onClick={this.handleSearch}>查询</Button>
                </FormItem>
                <div style={{ minHeight: '300px' }}>
                  {RangeData.length > 0 &&
                    RangeData.map((item) => {
                      const { title, promql } = item;
                      return (
                        <RangeChart
                          isEdit={false}
                          key={title}
                          {...parameter}
                          title={title}
                          type={promql}
                        />
                      );
                    })}
                </div>
              </div>
            </Card>
          </Spin>
        </Form>
      </Fragment>
    );
  }
}
