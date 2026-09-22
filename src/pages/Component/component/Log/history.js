import {
  Alert,
  Button,
  Col,
  DatePicker,
  Icon,
  Input,
  Modal,
  Row,
  Select,
  message
} from 'antd';
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import global from '@/utils/global';
import { buildHistoryLogQuery } from './historyLogQuery';
const {
  LOG_QUERY_LIMIT,
  buildLogCountExpression,
  collectCompleteLogRange,
  parseLogCountFrames
} = require('./logDownload');
const { RangePicker } = DatePicker;
const { Option } = Select;
const LOKI_DATASOURCE = {
  type: 'loki',
  uid: 'P8E80F9AEF21F6940'
};

// 优化的日志项组件，使用React.memo避免不必要的重新渲染
const LogItem = React.memo(({ item, index }) => (
  <div style={{ 
    padding: '2px 8px', 
    backgroundColor: '#212121',
    color: '#fff',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '12px',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  }}>
    <span style={{ 
      color: '#666666',
      marginRight: 12,
      fontWeight: 'normal',
      display: 'inline-block',
      textAlign: 'right'
    }}>
      {index + 1}
    </span>
    <span style={{ 
      color: '#666666',
      marginRight: 12,
      fontWeight: 'normal'
    }}>
      {item.formattedTime}
    </span>
    <span style={{ color: '#FFF' }}>
      {item.msg}
    </span>
  </div>
));
@connect(null, null, null, { withRef: true })
export default class HistoryLog extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: true,
      timeRange: 'last12h',
      customTimeRange: null,
      keyword: '',
      visibleStartIndex: 0,
      visibleEndIndex: 50,
      totalCount: null,
      countLoading: false,
      countFailed: false,
      downloadLoading: false,
      downloadLoaded: 0
    };

    this.logContainerRef = React.createRef();
    this.itemHeight = 22; // 估算的每个日志项高度
    this.lastQueryContext = null;
    this.lastOverflowPromptKey = null;
    this.overflowModal = null;
    this.downloadInFlight = false;
    this.queryRequestId = 0;
    this.unmounted = false;
  }
  componentDidMount() {
    this.loadData();
  }
  componentWillUnmount() {
    this.unmounted = true;
    this.queryRequestId += 1;
    if (this.overflowModal && this.overflowModal.destroy) {
      this.overflowModal.destroy();
    }
  }
  loadData() {
    this.setState({
      loading: true,
      countLoading: true,
      countFailed: false,
      totalCount: null,
      visibleStartIndex: 0,
      visibleEndIndex: 50
    });
    if (this.logContainerRef.current) {
      this.logContainerRef.current.scrollTop = 0;
    }
    const timeParams = this.getTimeParams();
    this.queryLokiLogs(timeParams);
  }

  requestLokiQuery = data => {
    const { dispatch } = this.props;

    return new Promise((resolve, reject) => {
      dispatch({
        type: 'region/fetchLokiLog',
        payload: {
          region_name: global.getCurrRegionName(),
          data
        },
        callback: resolve,
        handleError: reject
      });
    });
  };

  queryLokiLogs = async (timeParams) => {
    const { appAlias } = this.props;
    const { keyword } = this.state;

    if (!appAlias) {
      console.warn('appAlias is required for Loki query');
      this.setState({
        loading: false,
        countLoading: false,
        list: [],
        totalCount: null
      });
      return;
    }

    const requestId = this.queryRequestId + 1;
    this.queryRequestId = requestId;
    const expression = buildHistoryLogQuery(appAlias, keyword);
    const lokiQuery = {
      queries: [{
        refId: 'A',
        datasource: LOKI_DATASOURCE,
        direction: 'backward',
        editorMode: 'code',
        expr: expression,
        queryType: 'range',
        maxLines: LOG_QUERY_LIMIT
      }],
      range: timeParams,
      from: timeParams.from,
      to: timeParams.to
    };
    const countQuery = {
      queries: [{
        refId: 'log-count-A',
        datasource: LOKI_DATASOURCE,
        editorMode: 'code',
        expr: buildLogCountExpression(
          expression,
          timeParams.from,
          timeParams.to
        ),
        intervalMs: Math.max(
          1,
          Number(timeParams.to) - Number(timeParams.from)
        ),
        maxDataPoints: 1,
        instant: true,
        range: false,
        queryType: 'instant'
      }],
      range: timeParams,
      from: timeParams.from,
      to: timeParams.to
    };

    try {
      const countPromise = this.requestLokiQuery(countQuery).catch(error => {
        console.error('Loki count query error:', error);
        return null;
      });
      const response = await this.requestLokiQuery(lokiQuery);

      if (this.unmounted || requestId !== this.queryRequestId) {
        return;
      }

      const responseData = response && response.response_data;
      const logs = this.parseLokiResponse(responseData).sort(
        (a, b) => b.timestamp - a.timestamp
      );
      const queryContext = {
        appAlias,
        expression,
        from: Number(timeParams.from),
        to: Number(timeParams.to),
        total: null
      };

      this.lastQueryContext = queryContext;
      this.setState({
        loading: false,
        list: logs
      });

      const countResponse = await countPromise;

      if (this.unmounted || requestId !== this.queryRequestId) {
        return;
      }

      const countResponseData = countResponse && countResponse.response_data;
      const countResult =
        countResponseData &&
        countResponseData.results &&
        countResponseData.results['log-count-A'];
      const countFailed = !countResult;
      const parsedTotalCount = parseLogCountFrames(
        (countResult && countResult.frames) || []
      );
      const totalCount = countFailed
        ? null
        : Math.max(logs.length, parsedTotalCount);

      queryContext.total = totalCount;
      this.lastQueryContext = queryContext;
      this.setState({
        countLoading: false,
        countFailed,
        totalCount
      }, () => {
        if (
          totalCount > LOG_QUERY_LIMIT ||
          (countFailed && logs.length >= LOG_QUERY_LIMIT)
        ) {
          this.showLogOverflowPrompt(queryContext, { countFailed });
        }
      });
    } catch (error) {
      if (this.unmounted || requestId !== this.queryRequestId) {
        return;
      }

      console.error('Loki query error:', error);
      this.lastQueryContext = null;
      this.setState({
        loading: false,
        countLoading: false,
        countFailed: false,
        list: [],
        totalCount: null
      });
      message.error('历史日志查询失败，请稍后重试');
    }
  }

  parseLokiResponse = (data) => {
    const logs = [];
    
    if (!data?.results?.A?.frames) {
      return logs;
    }

    data.results.A.frames.forEach(frame => {
      if (!frame?.data?.values) return;
      
      const timeValues = frame.data.values[1] || [];
      const logValues = frame.data.values[2] || [];
      
      timeValues.forEach((timestamp, index) => {
        if (logValues[index]) {
          const parsedTimestamp = parseInt(timestamp);
          logs.push({
            id: `${parsedTimestamp}-${index}`,
            timestamp: parsedTimestamp,
            formattedTime: this.formatTimestamp(parsedTimestamp),
            msg: logValues[index]
          });
        }
      });
    });

    return logs;
  }

  formatTimestamp = (timestamp) => {
    const timestampStr = timestamp.toString();
    
    if (timestampStr.length > 13) {
      return new Date(timestamp / 1000000).toLocaleString();
    } else if (timestampStr.length === 13) {
      return new Date(timestamp).toLocaleString();
    } else {
      return new Date(timestamp * 1000).toLocaleString();
    }
  }
  getTimeParams = () => {
    const { timeRange, customTimeRange } = this.state;
    const now = Date.now();
    
    if (timeRange === 'custom' && customTimeRange) {
      return {
        from: customTimeRange[0].valueOf().toString(),
        to: customTimeRange[1].valueOf().toString()
      };
    }
    
    const timeRangeMap = {
      'last12h': { 
        from: (now - 12 * 60 * 60 * 1000).toString(), 
        to: now.toString() 
      },
      'last24h': { 
        from: (now - 24 * 60 * 60 * 1000).toString(), 
        to: now.toString() 
      },
      'last2d': { 
        from: (now - 2 * 24 * 60 * 60 * 1000).toString(), 
        to: now.toString() 
      },
      'last7d': { 
        from: (now - 7 * 24 * 60 * 60 * 1000).toString(), 
        to: now.toString() 
      },
      'last30d': { 
        from: (now - 30 * 24 * 60 * 60 * 1000).toString(), 
        to: now.toString() 
      }
    };
    
    return timeRangeMap[timeRange] || timeRangeMap['last12h'];
  }

  handleTimeRangeChange = (value) => {
    this.setState({ timeRange: value }, () => {
      if (value !== 'custom') {
        this.setState({ customTimeRange: null });
        this.loadData();
      }
    });
  }

  handleCustomTimeChange = (dates) => {
    this.setState({ customTimeRange: dates }, () => {
      if (dates && dates.length === 2) {
        this.loadData();
      }
    });
  }

  handleKeywordSearch = (value) => {
    const keyword = String(value || '').trim();
    this.setState({ keyword }, () => this.loadData());
  }

  handleKeywordChange = (event) => {
    if (event.target.value === '' && this.state.keyword !== '') {
      this.handleKeywordSearch('');
    }
  }

  showLogOverflowPrompt = (queryContext, { countFailed = false } = {}) => {
    const promptKey = `${queryContext.expression}\u0000${queryContext.from}\u0000${queryContext.to}`;

    if (this.lastOverflowPromptKey === promptKey) {
      return;
    }

    this.lastOverflowPromptKey = promptKey;
    if (this.overflowModal && this.overflowModal.destroy) {
      this.overflowModal.destroy();
    }
    this.overflowModal = Modal.confirm({
      title: '日志超过页面展示上限',
      content: countFailed
        ? `当前结果已达到 ${LOG_QUERY_LIMIT.toLocaleString()} 条，可能还有更多日志。是否下载当前查询范围的完整日志？`
        : `当前时间范围约有 ${queryContext.total.toLocaleString()} 条日志，页面最多展示 ${LOG_QUERY_LIMIT.toLocaleString()} 条。是否下载当前查询范围的完整日志？`,
      okText: '下载完整日志',
      cancelText: `仅查看最近 ${LOG_QUERY_LIMIT.toLocaleString()} 条`,
      onOk: () => this.handleDownload(queryContext)
    });
  };

  saveLogFile = (list, appAlias) => {
    if (!Array.isArray(list) || list.length === 0) {
      message.warning('当前没有可下载的日志');
      return;
    }

    // 生成文件内容
    const content = list.map(item => {
      return `[${item.formattedTime}] ${item.msg}`;
    }).join('\n');

    // 创建并下载文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${appAlias || 'service'}-logs-${timestamp}.txt`;
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理 URL 对象
    window.URL.revokeObjectURL(url);
  };

  handleDownload = async requestedContext => {
    const queryContext =
      requestedContext && requestedContext.expression
        ? requestedContext
        : this.lastQueryContext;

    if (!queryContext || this.downloadInFlight) {
      if (!queryContext) {
        message.warning('请先查询历史日志');
      }
      return;
    }

    this.downloadInFlight = true;
    this.setState({
      downloadLoading: true,
      downloadLoaded: 0
    });

    try {
      const logs = await collectCompleteLogRange({
        from: queryContext.from,
        to: queryContext.to,
        limit: LOG_QUERY_LIMIT,
        expectedTotal: queryContext.total,
        fetchRange: async range => {
          const response = await this.requestLokiQuery({
            queries: [{
              refId: 'A',
              datasource: LOKI_DATASOURCE,
              direction: 'backward',
              editorMode: 'code',
              expr: queryContext.expression,
              queryType: 'range',
              maxLines: range.limit
            }],
            range: {
              from: String(range.from),
              to: String(range.to)
            },
            from: String(range.from),
            to: String(range.to)
          });

          return this.parseLokiResponse(response && response.response_data);
        },
        onProgress: downloadLoaded => {
          if (!this.unmounted) {
            this.setState({ downloadLoaded });
          }
        }
      });
      const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
      if (!this.unmounted) {
        this.saveLogFile(sortedLogs, queryContext.appAlias);
      }
    } catch (error) {
      console.error('Download complete logs error:', error);
      message.error(error.message || '完整日志下载失败，请稍后重试');
    } finally {
      this.downloadInFlight = false;
      if (!this.unmounted) {
        this.setState({ downloadLoading: false });
      }
    }
  }

  handleScroll = (e) => {
    const { scrollTop, clientHeight } = e.target;
    const { list } = this.state;
    
    if (list.length > 50) { // 只有在数据量大时才启用虚拟滚动
      const startIndex = Math.floor(scrollTop / this.itemHeight);
      const endIndex = Math.min(startIndex + Math.ceil(clientHeight / this.itemHeight) + 10, list.length);
      
      this.setState({
        visibleStartIndex: Math.max(0, startIndex - 5),
        visibleEndIndex: endIndex
      });
    }
  }
  render() {
    const {
      loading,
      list,
      timeRange,
      customTimeRange,
      visibleStartIndex,
      visibleEndIndex,
      totalCount,
      countLoading,
      countFailed,
      downloadLoading,
      downloadLoaded
    } = this.state;
    
    // 虚拟滚动优化：只渲染可见的日志项
    const visibleItems = list.length > 50 
      ? list.slice(visibleStartIndex, visibleEndIndex)
      : list;

    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.tab.log.HistoryLog.title'/>}
        visible
        width={1024}
        bodyStyle={{ background: '#222222', color: '#fff' }}
        onCancel={this.props.onCancel}
        footer={[
          <Button 
            key="download" 
            type="primary" 
            icon="download" 
            onClick={() => this.handleDownload()}
            disabled={list.length === 0}
            loading={downloadLoading}
            style={{ marginRight: 8 }}
          >
            {downloadLoading
              ? `正在获取 ${downloadLoaded.toLocaleString()}${Number.isFinite(totalCount) ? ` / ${totalCount.toLocaleString()}` : ''} 条`
              : '下载完整日志'}
          </Button>,
          <Button key="close" onClick={this.props.onCancel}>
            <FormattedMessage id='componentOverview.body.tab.log.HistoryLog.close'/>
          </Button>
        ]}
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <span style={{ marginRight: 8 }}>时间范围：</span>
            <Select
              value={timeRange}
              onChange={this.handleTimeRangeChange}
              style={{ width: 120 }}
            >
              <Option value="last12h">近12小时</Option>
              <Option value="last24h">近24小时</Option>
              <Option value="last2d">近2天</Option>
              <Option value="last7d">近7天</Option>
              <Option value="last30d">近30天</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Col>
          <Col span={12}>
            {timeRange === 'custom' && (
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                value={customTimeRange}
                onChange={this.handleCustomTimeChange}
                placeholder={['开始时间', '结束时间']}
                style={{ width: '100%' }}
              />
            )}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <span style={{ marginRight: 8 }}>
              <FormattedMessage id='componentOverview.body.tab.log.text'/>
            </span>
            <Input.Search
              allowClear
              enterButton
              placeholder={formatMessage({ id: 'componentOverview.body.tab.log.filtertext' })}
              style={{ width: 360 }}
              onChange={this.handleKeywordChange}
              onSearch={this.handleKeywordSearch}
            />
          </Col>
        </Row>
        {Number.isFinite(totalCount) && (
          <Alert
            type={totalCount > LOG_QUERY_LIMIT ? 'warning' : 'info'}
            showIcon
            message={`当前范围共 ${totalCount.toLocaleString()} 条日志，页面已加载 ${list.length.toLocaleString()} 条`}
            description={
              totalCount > LOG_QUERY_LIMIT
                ? `页面最多展示最近 ${LOG_QUERY_LIMIT.toLocaleString()} 条，下载按钮将获取当前查询范围的完整日志。`
                : '当前页面已经包含所选范围内的全部日志。'
            }
            style={{ marginBottom: 16 }}
          />
        )}
        {countFailed && (
          <Alert
            type="warning"
            showIcon
            message="日志总量统计失败"
            description="页面展示当前预览结果；完整下载仍会按所选时间范围分段获取日志。"
            style={{ marginBottom: 16 }}
          />
        )}
        {countLoading && !loading && (
          <Alert
            type="info"
            showIcon
            message="正在统计当前范围的日志总量"
            style={{ marginBottom: 16 }}
          />
        )}
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Icon
              type="loading"
              style={{ marginTop: 100, marginBottom: 100 }}
            />
          </div>
        ) : (
          ''
        )}

        {!loading ? (
          <div style={{ textAlign: 'left' }}>
            {list.length > 0 ? (
              <div 
                ref={this.logContainerRef}
                style={{ 
                  maxHeight: 500, 
                  overflowY: 'auto',
                  position: 'relative',
                  backgroundColor: '#212121'
                }}
                onScroll={this.handleScroll}
              >
                {list.length > 50 ? (
                  // 虚拟滚动容器
                  <div style={{ height: list.length * this.itemHeight }}>
                    <div 
                      style={{ 
                        transform: `translateY(${visibleStartIndex * this.itemHeight}px)`,
                        position: 'absolute',
                        width: '100%'
                      }}
                    >
                      {visibleItems.map((item, index) => (
                        <LogItem key={item.id} item={item} index={visibleStartIndex + index} />
                      ))}
                    </div>
                  </div>
                ) : (
                  // 正常渲染（数据量小时）
                  visibleItems.map((item, index) => (
                    <LogItem key={item.id} item={item} index={index} />
                  ))
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>
                {/* 暂无历史日志 */}
                <FormattedMessage id='componentOverview.body.tab.log.HistoryLog.null'/>
              </p>
            )}
          </div>
        ) : (
          ''
        )}
      </Modal>
    );
  }
}
