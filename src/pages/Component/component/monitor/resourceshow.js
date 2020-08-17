/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
import RangeChart from "@/components/CustomChart/rangeChart";
import { Button, Col, DatePicker, Form, Row } from "antd";
import { connect } from "dva";
import moment from "moment";
import React, { Fragment, PureComponent } from "react";

const FormItem = Form.Item;
// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail
}))
@Form.create()
export default class ResourceShow extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      start: new Date().getTime() / 1000 - 60 * 60,
      end: new Date().getTime() / 1000
    };
  }
  componentDidMount() {}
  componentWillUnmount() {}

  disabledDate = current => {
    // Can not select days before today and today
    return (
      current &&
      (current > moment().endOf("day") ||
        current <
          moment(new Date(new Date().getTime() - 7 * 24 * 1 * 60 * 60 * 1000)))
    );
  };

  disabledDateTime = () => {
    return {
      disabledHours: () => this.range(0, 24).splice(4, 20),
      disabledMinutes: () => this.range(30, 60),
      disabledSeconds: () => [55, 56]
    };
  };

  range = (start, end) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  queryAll = () => {
    const { form } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        this.setState({ start: values.start.valueOf()/1000, end: values.end.valueOf()/1000 });
      }
    });
  };

  render() {
    const { appDetail, dispatch, form } = this.props;
    const { getFieldDecorator } = form;
    const { start, end } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 10
        }
      }
    };
    return (
      <Fragment>
        <Row>
          <Col span={6}>
            <FormItem {...formItemLayout} label="开始时间">
              {getFieldDecorator("start", {
                rules: [{ required: false, message: "请选择开始时间" }],
                initialValue: moment(
                  new Date(new Date().getTime() - 1 * 60 * 60 * 1000)
                )
              })(
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={this.disabledDate}
                  disabledTime={this.disabledDateTime}
                  showTime={{ defaultValue: moment("00:00:00", "HH:mm:ss") }}
                />
              )}
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem {...formItemLayout} label="结束时间">
              {getFieldDecorator("end", {
                rules: [{ required: false, message: "请选择结束时间" }],
                initialValue: moment(new Date())
              })(
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={this.disabledDate}
                  disabledTime={this.disabledDateTime}
                  showTime={{ defaultValue: moment("00:00:00", "HH:mm:ss") }}
                />
              )}
            </FormItem>
          </Col>
          <Col span={6} style={{ lineHeight: "39.99px" }}>
            <Button onClick={this.queryAll}>查询</Button>
          </Col>
        </Row>
        <Row style={{ padding: "-8px" }}>
          <Col span={12} style={{ padding: "8px" }}>
            <RangeChart
              start={start}
              end={end}
              dispatch={dispatch}
              appDetail={appDetail}
              type="containerMem"
            />
          </Col>
          <Col span={12} style={{ padding: "8px" }}>
            <RangeChart
              start={start}
              end={end}
              dispatch={dispatch}
              appDetail={appDetail}
              type="containerCpu"
            />
          </Col>
          <Col span={12} style={{ padding: "8px" }}>
            <RangeChart
              start={start}
              end={end}
              dispatch={dispatch}
              appDetail={appDetail}
              type="containerNetR"
            />
          </Col>
          <Col span={12} style={{ padding: "8px" }}>
            <RangeChart
              start={start}
              end={end}
              dispatch={dispatch}
              appDetail={appDetail}
              type="containerNetT"
            />
          </Col>
        </Row>
      </Fragment>
    );
  }
}
