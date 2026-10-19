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
    const { data, metric, emptyText, unitLabel } = this.props;
    const points = overviewData.metricPoints(data);
    const color = COLORS[metric] || COLORS.cpu;
    this.chart.setOption(
      {
        animationDuration: 420,
        grid: { top: 24, right: 18, bottom: 28, left: 52 },
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: theme['heading-color'],
          borderWidth: 0,
          formatter: params => {
            const point = params && params[0];
            if (!point) return '';
            return `${this.echarts.format.formatTime('yyyy-MM-dd hh:mm', point.value[0])}<br/>${
              point.marker
            }${Number(point.value[1]).toFixed(metric === 'network' ? 0 : 2)} ${unitLabel}`;
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
          max: metric === 'network' ? null : 100,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: theme['rbd-label-color'],
            formatter: value => `${value}${metric === 'network' ? '' : '%'}`
          },
          splitLine: { lineStyle: { color: theme['border-color-base'], type: 'dashed' } }
        },
        series: [
          {
            type: 'line',
            data: points,
            smooth: 0.35,
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
      true
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
