/* eslint-disable react/no-redundant-should-component-update */
/* eslint-disable no-nested-ternary */
/* eslint-disable prettier/prettier */
/* eslint-disable array-callback-return */
/* eslint-disable prettier/prettier */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
import { Button, Col, DatePicker, Form, Row } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import {
  arrayMove,
  SortableContainer,
  SortableElement
} from 'react-sortable-hoc';
import styless from './index.less';
import RangeChart from './rangeChart';

const { RangePicker } = DatePicker;

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
  disabledDate = current => {
    // Can not select days before today and today
    return current && current > moment().endOf('day');
  };

  range = (start, end) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  queryAll = () => {
    this.setState(
      {
        isRender: true
      },
      () => {
        this.setState({
          isRender: false
        });
      }
    );
  };

  onSortEnd = ({ oldIndex, newIndex }, e) => {
    e.preventDefault();
    const { handleSorting, RangeData = [] } = this.props;
    if (oldIndex !== newIndex && RangeData && RangeData.length > 0) {
      const arr = arrayMove(RangeData, oldIndex, newIndex);
      const graphIds = [];

      arr.map(item => {
        graphIds.push(item.graph_id);
      });
      handleSorting(graphIds);
    }
  };

  handleChangeTimes = values => {
    let startTime = '';
    let endTime = '';

    if (values && values.length > 1) {
      startTime = moment(values[0]).valueOf() / 1000;
      endTime = moment(values[1]).valueOf() / 1000;
    }
    this.setState(
      {
        start: startTime,
        end: endTime
      },
      () => {
        if (this.props.handleUpData) {
          this.props.handleUpData();
        }
      }
    );
  };

  render() {
    const {
      appDetail,
      dispatch,
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
    const { start, end, isLoading, isRender } = this.state;
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
        <div key={ID} index={sequence} className={styless.RangeChartBox}>
          <RangeChart
            key={ID}
            moduleName="CustomMonitor"
            style={{ cursor: 'all-scroll' }}
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
          {items.map(item => {
            return (
              <SortableItem
                style={{ zIndex: 10 }}
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
            <RangePicker
              separator={<FormattedMessage id='componentOverview.body.tab.monitor.to'/>}
              style={{ width: '390px' }}
              disabledDate={this.disabledDate}
              onChange={value => {
                this.handleChangeTimes(value);
              }}
              defaultValue={[
                moment(
                  new Date(new Date().getTime() - 1 * 60 * 60 * 1000),
                  'HH:mm:ss'
                ),
                moment(moment(new Date()), 'HH:mm:ss')
              ]}
              showTime={{
                hideDisabledOptions: true
              }}
              format="YYYY-MM-DD HH:mm:ss"
            />
            <Button style={{ marginLeft: '5px' }} onClick={this.queryAll}>
              {/* 查询 */}
              <FormattedMessage id='componentOverview.body.tab.monitor.query'/>
            </Button>
            {operation}
          </Col>
        </Row>

        {moduleName === 'ResourceMonitoring' ? (
          <Row style={{ padding: '-8px' }}>
            {RangeData.map(item => {
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
              style={{ zIndex: 10 }}
              items={RangeData}
              onSortEnd={this.onSortEnd}
            />
          </div>
        ) : (
          RangeData.map(item => {
            return (
              <div style={{ marginTop: '20px' }}>
                <RangeChart key={item} {...parameter} type={item} />
              </div>
            );
          })
        )}
      </Fragment>
    );
  }
}
