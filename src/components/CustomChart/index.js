import { Button, Col, DatePicker, Form, Row } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import {
  arrayMove,
  SortableContainer,
  SortableElement
} from 'react-sortable-hoc';
import styless from './index.less';
import RangeChart from './rangeChart';

const { RangePicker } = DatePicker;

// 样式常量
const GRID_STYLES = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridGap: '16px'
};

const SORTABLE_CONTAINER_STYLE = {
  marginTop: '20px'
};

const RANGE_PICKER_STYLE = {
  width: '390px'
};

const BUTTON_STYLE = {
  marginLeft: '5px'
};

// 时间常量
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_HOUR_SECONDS = 60 * 60;

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
    const currentTime = new Date().getTime() / 1000;
    this.state = {
      start: currentTime - ONE_HOUR_SECONDS,
      end: currentTime,
      isLoading: true,
      isRender: false
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.moduleName && nextProps.moduleName === 'CustomMonitor') {
      if (nextProps.isRender || nextState.isRender) {
        return true;
      }
      if (nextProps.RangeData.length === this.props.RangeData.length) {
        return false;
      }
    }
    return true;
  }
  // 禁用未来日期
  disabledDate = current => {
    return current && current > moment().endOf('day');
  };

  // 触发重新渲染
  queryAll = () => {
    this.setState({ isRender: true }, () => {
      this.setState({ isRender: false });
    });
  };

  onSortEnd = ({ oldIndex, newIndex }, e) => {
    e.preventDefault();
    const { handleSorting, RangeData = [] } = this.props;
    if (oldIndex !== newIndex && RangeData && RangeData.length > 0) {
      const arr = arrayMove(RangeData, oldIndex, newIndex);
      const graphIds = arr.map(item => item.graph_id);
      handleSorting(graphIds);
    }
  };

  handleCancelLoading = () => {
    this.setState({ isLoading: false });
  };

  // 处理时间范围变化
  handleChangeTimes = values => {
    if (!values || values.length < 2) {
      return;
    }

    const startTime = moment(values[0]).valueOf() / 1000;
    const endTime = moment(values[1]).valueOf() / 1000;

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

  // 渲染内容区域
  renderContent = (moduleName, RangeData, parameter, SortableList) => {
    if (moduleName === 'ResourceMonitoring') {
      return (
        <Row style={{ padding: '-8px' }}>
          {RangeData.map((item, index) => {
            const isEven = ((index + 1) % 2) === 0;
            const padding = isEven ? '8px 0px 8px 8px' : '8px 8px 8px 0';
            return (
              <Col span={12} key={item} style={{ padding }}>
                <RangeChart {...parameter} type={item} />
              </Col>
            );
          })}
        </Row>
      );
    }

    if (moduleName === 'CustomMonitor') {
      return (
        <div style={SORTABLE_CONTAINER_STYLE}>
          <SortableList
            axis="xy"
            distance={1}
            style={{ zIndex: 10 }}
            items={RangeData}
            onSortEnd={this.onSortEnd}
          />
        </div>
      );
    }

    return RangeData.map(item => (
      <div key={item} style={SORTABLE_CONTAINER_STYLE}>
        <RangeChart key={item} {...parameter} type={item} />
      </div>
    ));
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
            onCancelLoading={this.handleCancelLoading}
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

    const SortableList = SortableContainer(({ items }) => (
      <div style={GRID_STYLES}>
        {items.map(item => (
          <SortableItem
            style={{ zIndex: 10 }}
            key={item.ID}
            index={item.sequence}
            value={item}
          />
        ))}
      </div>
    ));
    return (
      <Fragment>
        <Row>
          <Col span={24} className={styless.customBox}>
            <RangePicker
              separator={<FormattedMessage id='componentOverview.body.tab.monitor.to' />}
              style={RANGE_PICKER_STYLE}
              disabledDate={this.disabledDate}
              onChange={this.handleChangeTimes}
              defaultValue={[
                moment(new Date(new Date().getTime() - ONE_HOUR_MS), 'HH:mm:ss'),
                moment(new Date(), 'HH:mm:ss')
              ]}
              showTime={{
                hideDisabledOptions: true
              }}
              format="YYYY-MM-DD HH:mm:ss"
            />
            <Button style={BUTTON_STYLE} onClick={this.queryAll}>
              <FormattedMessage id='componentOverview.body.tab.monitor.query' />
            </Button>
            {operation}
          </Col>
        </Row>

        {this.renderContent(moduleName, RangeData, parameter, SortableList)}
      </Fragment>
    );
  }
}
