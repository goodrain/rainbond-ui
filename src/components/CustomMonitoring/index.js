/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
// eslint-disable-next-line react/no-multi-comp
import React, { Fragment, PureComponent } from 'react';
import moment from 'moment';
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
import { Axis, Chart, Geom, Legend, Tooltip } from 'bizcharts';
import styless from './index.less';
import ConfirmModal from '@/components/ConfirmModal';
import monitorDataUtil from '@/utils/monitorDataUtil';
import { start } from '@/services/app';

const FormItem = Form.Item;
@Form.create()
@connect()
export default class CustomMonitoring extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      indicators: [],
      memoryRange: [],
      performanceObj: {},
      loading: false,
      showDelete: false
    };
  }
  componentWillMount() {
    this.fetchComponentMetrics();
  }
  fetchComponentMetrics = () => {
    const { dispatch, serviceId } = this.props;
    dispatch({
      type: 'appControl/fetchComponentMetrics',
      payload: {
        serviceId
      },
      callback: (res) => {
        this.setState({
          indicators: res.list
        });
        console.log('res serviceId', res);
      }
    });
  };

  getMeta = () => {
    const { type } = this.props;
    switch (type) {
      case 'containerMem':
        return { title: '内存使用量', label: '内存（MB）', unit: ' MB' };
      case 'containerCpu':
        return { title: 'CPU使用率', label: 'CPU使用率（%）', unit: '%' };
      case 'containerNetR':
        return { title: '传入流量', label: '流量（KB/s）', unit: ' KB/s' };
      case 'containerNetT':
        return { title: '传出流量', label: '流量（KB/s）', unit: ' KB/s' };
      case 'responseTime':
        return { title: '响应时间', label: '响应时间（ms）', unit: ' ms' };
      case 'throughput':
        return { title: '吞吐率', label: '吞吐率（dps）', unit: ' dps' };
      case 'numberOnline':
        return { title: '在线人数', label: '在线人数', unit: '' };
      default:
        return { title: '', label: '', unit: '' };
    }
  };

  converData = (dataRange) => {
    const rangedata = [];
    if (dataRange) {
      dataRange.map((item) => {
        const cid = item.metric.pod;
        if (item.values) {
          item.values.map((v) => {
            rangedata.push({
              cid,
              time: v[0] * 1000,
              value: Math.floor(Number(v[1]) * 100) / 100
            });
          });
        }
      });
    }
    return rangedata;
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
  onDelete = () => {
    this.setState({
      showDelete: true
    });
  };
  cancalDelete = () => {
    this.setState({
      showDelete: false
    });
  };
  handleSubmitDelete = () => {
    this.cancalDelete();
  };
  render() {
    const { moduleName, form, onCancel } = this.props;
    const { getFieldDecorator } = form;
    const { memoryRange, performanceObj, loading, indicators } = this.state;
    const { title, label, unit } = this.getMeta();
    const data =
      moduleName === 'PerformanceAnalysis'
        ? monitorDataUtil.queryRangeTog2F(performanceObj, title)
        : this.converData(memoryRange);
    const cols = {
      time: {
        alias: '时间',
        tickCount: 10,
        type: 'time',
        formatter: (v) => moment(new Date(v)).locale('zh-cn').format('HH:mm')
      },
      value: {
        alias: { label },
        tickCount: 5
      },
      cid: {
        type: 'cat'
      }
    };

    return (
      <Fragment>
        {this.state.showDelete && (
          <ConfirmModal
            title="业务监控视图删除"
            desc="确定要删除此视图吗？"
            subDesc="此操作不可恢复"
            onOk={this.handleSubmitDelete}
            onCancel={this.cancalDelete}
          />
        )}
        <Form onSubmit={this.onOk}>
          <Spin spinning={loading}>
            <Col span={12}>
              <Card
                className={styless.customCard}
                headStyle={{ padding: '0 24px' }}
                title={
                  <FormItem>
                    {getFieldDecorator('name', {
                      initialValue: '',
                      rules: [
                        { required: true, message: '请填写标题' },
                        {
                          max: 64,
                          message: '最大长度64位'
                        }
                      ]
                    })(
                      <Input
                        style={{ width: '350px' }}
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
                    <a onClick={this.onDelete}>删除</a>
                    <a onClick={this.onOk}>保存</a>
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
                    {getFieldDecorator('query', {
                      initialValue: '',
                      rules: [
                        { required: true, message: '请填写查询条件' },
                        {
                          max: 255,
                          message: '最大长度255位'
                        }
                      ]
                    })(
                      <AutoComplete
                        style={{ width: '350px', marginRight: '5px' }}
                        placeholder="请填写查询条件"
                      >
                        {indicators &&
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
                          })}
                      </AutoComplete>
                    )}
                    <Button onClick={this.onOk}>查询</Button>
                  </FormItem>
                  <Chart height={400} data={data} scale={cols} forceFit>
                    <Legend />
                    <Axis
                      name="value"
                      label={{
                        formatter: (val) => `${val}${unit}`
                      }}
                    />
                    <Axis name="time" />
                    <Tooltip
                      crosshairs={{
                        type: 'y'
                      }}
                    />
                    <Geom
                      type="line"
                      position="time*value"
                      color="cid"
                      shape="smooth"
                      size={2}
                    />
                  </Chart>
                </div>
              </Card>
            </Col>
          </Spin>
        </Form>
      </Fragment>
    );
  }
}
