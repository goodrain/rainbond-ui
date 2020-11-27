/* eslint-disable react/no-redundant-should-component-update */
/* eslint-disable no-nested-ternary */
/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
import React, { Fragment, PureComponent } from 'react';
import { Button, Col, DatePicker, Form, Row } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import RangeChart from './rangeChart';
import styless from './index.less';

const FormItem = Form.Item;
// eslint-disable-next-line react/no-multi-comp
@connect(({ user, appControl, loading }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  baseInfo: appControl.baseInfo,
  editLoading: loading.effects['monitor/editServiceMonitorFigure']
}))
@Form.create()
export default class ChartTitle extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      start: new Date().getTime() / 1000 - 60 * 60,
      end: new Date().getTime() / 1000,
      isLoading: true,
      isRender: false
    };
  }

  shouldComponentUpdate(nextProps, _nextState) {
    if (nextProps.moduleName && nextProps.moduleName === 'CustomMonitor') {
      if (nextProps.isRender || _nextState.isRender) {
        return true;
      } else if (nextProps.RangeData.length == this.props.RangeData.length) {
        return false;
      }
    }

    return true;
  }

  disabledDate = (current) => {
    // Can not select days before today and today
    return (
      current &&
      (current > moment().endOf('day') ||
        current <
          moment(new Date(new Date().getTime() - 7 * 24 * 1 * 60 * 60 * 1000)))
    );
  };
  disabledDates = (current) => {
    return current < moment(new Date()) || current > moment().endOf('day');
  };
  disabledDateStartTime = (current) => {
    const reset = {
      disabledHours: () => this.range(0, 24),
      disabledMinutes: () => this.range(0, 60),
      disabledSeconds: () => this.range(0, 60)
    };
    if (current) {
      const today = moment().date();
      const currentToday = current.date();
      const currentHour = current.hour();
      if (today == currentToday) {
        const minute = Number(moment().minutes());
        const hour = Number(moment().hour());
        if (currentHour < hour) {
          return {
            disabledHours: () => this.range(hour + 1, 24)
          };
        }
        return {
          disabledHours: () => this.range(hour + 1, 24),
          disabledMinutes: () => this.range(minute + 1, 60)
        };
      }
    } else {
      return reset;
    }
  };
  disabledDateEndTime = (current) => {
    const starts = this.props.form.getFieldValue('start');
    const startMonth = starts.month() + 1;
    const startDate = starts.date();
    const startHour = starts.hour();
    const startMinute = starts.minute();

    const reset = {
      disabledHours: () => this.range(0, 24),
      disabledMinutes: () => this.range(0, 60),
      disabledSeconds: () => this.range(0, 60)
    };
    if (current) {
      const today = moment().date();
      const currentMonth = current.month() + 1;
      const currentToday = current.date();
      const currentHour = current.hour();
      const currentMinute = current.minute();

      if (startMonth > currentMonth || startDate > currentToday) {
        return reset;
      }
      if (startMonth == currentMonth && startDate == currentToday) {
        if (startHour > currentHour) {
          return {
            disabledHours: () => this.range(0, startHour)
          };
        }
        if (startHour === currentHour && startMinute > currentMinute) {
          return {
            disabledHours: () => this.range(0, startHour),
            disabledMinutes: () => this.range(0, startMinute)
          };
        }
      }
      if (today == currentToday) {
        const minute = Number(moment().minutes());
        const hour = Number(moment().hour());
        if (currentHour < hour) {
          return {
            disabledHours: () => this.range(hour + 1, 24)
          };
        }
        return {
          disabledHours: () => this.range(hour + 1, 24),
          disabledMinutes: () => this.range(minute + 1, 60)
        };
      }
    } else {
      return reset;
    }
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
        this.setState(
          {
            isRender: true,
            start: values.start.valueOf() / 1000,
            end: values.end.valueOf() / 1000
          },
          () => {
            this.setState({
              isRender: false
            });
          }
        );
      }
    });
  };

  onSortEnd = ({ oldIndex, newIndex }, e) => {
    e.preventDefault();
    const { handleSorting, RangeData = [] } = this.props;
    if (oldIndex !== newIndex && RangeData && RangeData.length > 0) {
      const graphIds = [];
      RangeData.map((item) => {
        const { sequence, graph_id: id } = item;
        if (sequence === oldIndex || sequence === newIndex) {
          graphIds.push(id);
        }
      });
      handleSorting(graphIds);
    }
  };

  render() {
    const {
      appDetail,
      dispatch,
      form,
      moduleName,
      operation,
      onDelete,
      onEdit,
      upData,
      baseInfo,
      serviceId = '',
      RangeData = [],
      appAlias = ''
    } = this.props;
    const { getFieldDecorator } = form;
    const { start, end, isLoading, isRender } = this.state;
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
    const parameter = {
      moduleName,
      start,
      end,
      dispatch,
      appDetail,
      baseInfo,
      appAlias
    };
    const SortableItem = SortableElement(({ value }) => {
      const { title, promql, sequence, ID } = value;
      return (
        <div
          key={ID}
          index={sequence}
          style={{
            zIndex: 99999999,
            cursor: 'all-scroll',
            minHeight: '278px'
          }}
        >
          <RangeChart
            key={ID}
            moduleName="CustomMonitor"
            style={{ zIndex: 99999999, cursor: 'all-scroll' }}
            {...parameter}
            upData={upData}
            onCancelLoading={this.setState({ isLoading: false })}
            isLoading={isLoading}
            serviceId={serviceId}
            isRender={isRender}
            CustomMonitorInfo={value}
            title={title}
            type={promql}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      );
    });
    const gridStyles = {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridGap: '16px'
    };
    const SortableList = SortableContainer(({ items }) => {
      return (
        <div style={gridStyles}>
          {items.map((item) => {
            return (
              <SortableItem
                style={{ zIndex: 99999999 }}
                key={item.ID}
                index={item.sequence}
                value={item}
              />
            );
          })}
        </div>
      );
    });
    return (
      <Fragment>
        <Row>
          <Col span={24} className={styless.customBox}>
            <FormItem {...formItemLayout} label="开始时间">
              {getFieldDecorator('start', {
                rules: [{ required: false, message: '请选择开始时间' }],
                initialValue: moment(
                  new Date(new Date().getTime() - 1 * 60 * 60 * 1000)
                )
              })(
                <DatePicker
                  style={{ width: '195px' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={this.disabledDate}
                  disabledTime={this.disabledDateStartTime}
                  showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label="结束时间">
              {getFieldDecorator('end', {
                rules: [{ required: false, message: '请选择结束时间' }],
                initialValue: moment(new Date())
              })(
                <DatePicker
                  style={{ width: '195px' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={this.disabledDate}
                  disabledTime={this.disabledDateEndTime}
                  showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                />
              )}
            </FormItem>
            <Button style={{ marginLeft: '5px' }} onClick={this.queryAll}>
              查询
            </Button>
            {operation}
          </Col>
        </Row>

        {moduleName === 'ResourceMonitoring' ? (
          <Row style={{ padding: '-8px' }}>
            {RangeData.map((item) => {
              return (
                <Col span={12} key={item} style={{ padding: '8px' }}>
                  <RangeChart {...parameter} type={item} />
                </Col>
              );
            })}
          </Row>
        ) : moduleName === 'CustomMonitor' ? (
          <div style={{ marginTop: '20px' }}>
            <SortableList
              axis="xy"
              distance={1}
              style={{ zIndex: 99999999 }}
              items={RangeData}
              onSortEnd={this.onSortEnd}
            />
          </div>
        ) : (
          RangeData.map((item) => {
            return <RangeChart key={item} {...parameter} type={item} />;
          })
        )}
      </Fragment>
    );
  }
}
