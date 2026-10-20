import React, { PureComponent } from 'react';
import theme from '../../../../config/theme';
import overviewData from '../overviewData';
import styles from '../index.less';

const COLORS = {
  cpu: theme['primary-color'],
  memory: theme['success-color'],
  network: theme['warning-color']
};
const AUXILIARY_FONT_SIZE = parseFloat(theme['rbd-auxiliary-size']) || 12;

export default class ResourceTrend extends PureComponent {
  componentDidMount() {
    this.mounted = true;
    import('echarts').then(module => {
      if (!this.mounted) return;
      this.echarts = module.default || module;
      this.chart = this.echarts.init(this.container);
      this.updateChart();
      if (window.ResizeObserver) {
        this.resizeObserver = new window.ResizeObserver(this.resize);
        this.resizeObserver.observe(this.container);
      }
    });
    window.addEventListener('resize', this.resize);
  }

  componentDidUpdate() {
    this.updateChart();
  }

  componentWillUnmount() {
    this.mounted = false;
    window.removeEventListener('resize', this.resize);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  resize = () => {
    if (this.chart) this.chart.resize();
  };

  updateChart = () => {
    if (!this.chart) return;
    const { data, metric, emptyText, unitLabel, seriesLabel, usageLabel, unavailableLabel } = this.props;
    const points = overviewData.metricChartPoints(data);
    const lookup = overviewData.absoluteMetricLookup(data, metric);
    const color = COLORS[metric] || COLORS.cpu;
    this.chart.setOption(
      {
        animation: false,
        grid: { top: 22, right: 18, bottom: 32, left: metric === 'network' ? 66 : 46 },
        tooltip: {
          trigger: 'axis',
          confine: true,
          transitionDuration: 0,
          axisPointer: { type: 'line', animation: false, lineStyle: { color, type: 'dashed' } },
          backgroundColor: theme['heading-color'],
          textStyle: { color: theme['rbd-background-color'] },
          borderWidth: 0,
          formatter: params => {
            const point = params && params[0];
            if (!point || !overviewData.isNumber(point.value[1])) return '';
            return overviewData.metricTooltipHtml(point, {
              metric, lookup, unitLabel, seriesLabel, usageLabel, unavailableLabel,
              timeLabel: this.echarts.format.formatTime('yyyy-MM-dd hh:mm', point.value[0])
            });
          }
        },
        xAxis: {
          type: 'time',
          boundaryGap: false,
          axisLine: { lineStyle: { color: theme['border-color-base'] } },
          axisTick: { show: false },
          axisLabel: { color: theme['rbd-label-color'], hideOverlap: true }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: metric === 'network' ? null : overviewData.percentageAxisMax(points),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: theme['rbd-label-color'],
            formatter: value => {
              if (metric !== 'network') return `${value}%`;
              const throughput = overviewData.formatThroughput(value);
              return `${throughput.value} ${throughput.unit}`;
            }
          },
          splitLine: { lineStyle: { color: theme['border-color-base'], type: 'dashed' } }
        },
        series: [
          {
            id: 'overview-resource',
            type: 'line',
            name: seriesLabel,
            data: points,
            connectNulls: false,
            smooth: 0.2,
            showSymbol: false,
            symbolSize: 8,
            lineStyle: { width: 3, color },
            itemStyle: { color },
            areaStyle: {
              color: new this.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `${color}40` },
                { offset: 1, color: `${color}05` }
              ])
            }
          }
        ],
        graphic: points.length
          ? []
          : [
              {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: emptyText,
                  fill: theme['rbd-label-color'],
                  fontSize: AUXILIARY_FONT_SIZE
                }
              }
            ]
      },
      false
    );
  };

  render() {
    return (
      <div
        className={styles.trendChart}
        ref={node => {
          this.container = node;
        }}
      />
    );
  }
}
