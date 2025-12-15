import { Button, Icon, Modal, Select, DatePicker, Row, Col } from 'antd';
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
const { RangePicker } = DatePicker;
const { Option } = Select;

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
      visibleStartIndex: 0,
      visibleEndIndex: 50,
    };
    
    this.logContainerRef = React.createRef();
    this.itemHeight = 22; // 估算的每个日志项高度
  }
  componentDidMount() {
    this.loadData();
  }
  loadData() {
    this.setState({ loading: true });
    const timeParams = this.getTimeParams();
    this.queryLokiLogs(timeParams);
  }

  queryLokiLogs = async (timeParams) => {
    const { appAlias, url, dispatch } = this.props;
    
    if (!appAlias) {
      console.warn('appAlias is required for Loki query');
      this.setState({ loading: false, list: [] });
      return;
    }

    const lokiQuery = {
      queries: [{
        refId: "A",
        datasource: {
          type: "loki",
          uid: "P8E80F9AEF21F6940"
        },
        editorMode: "code",
        expr: `{service_alias="${appAlias}"}`,
        queryType: "range",
        maxLines: 5000
      }],
      range: timeParams,
      from: timeParams.from,
      to: timeParams.to
    }; 
    dispatch({
      type: 'region/fetchLokiLog',
      payload: {
        url: url+'/api/ds/query',
        data: lokiQuery
      },
      callback: (res) => {
        
        const logs = this.parseLokiResponse(res.bean);
        this.setState({ 
          loading: false, 
          list: logs.sort((a, b) => b.timestamp - a.timestamp)
        });
      },
      handleError: (error) => {
        console.error('Loki query error:', error);
        this.setState({ loading: false, list: [] });
      }
    });
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

  handleDownload = () => {
    const { list } = this.state;
    const { appAlias } = this.props;
    
    if (list.length === 0) {
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
    const { loading, list, timeRange, customTimeRange, visibleStartIndex, visibleEndIndex } = this.state;
    
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
            onClick={this.handleDownload}
            disabled={list.length === 0}
            style={{ marginRight: 8 }}
          >
            下载日志
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
