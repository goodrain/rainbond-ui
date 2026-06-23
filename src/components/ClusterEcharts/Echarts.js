import React, { Component } from 'react'
import * as echarts from 'echarts';
import global from '@/utils/global'


export default class Chart extends Component {
  constructor(props) {
    super(props)
    this.chart = null;
  }

  componentDidMount() {
    this.loadTeamAppEcharts()
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.svalue !== this.props.svalue ||
      prevProps.usedValue !== this.props.usedValue ||
      prevProps.chartType !== this.props.chartType
    ) {
      this.updateChart();
    }
  }

  loadTeamAppEcharts = () => {
    const { keys } = this.props;
    const echartsId = '#' + keys + 'clusterInfo';
    this.chart = echarts.init(document.querySelector(echartsId));
    this.updateChart();
  };

  updateChart = () => {
    const { keys, svalue, cname, usedValue, unit, chartType } = this.props
    if (chartType === 'progressGauge') {
      this.updateProgressGauge();
      return;
    }
    // 2. options配置项
    var datas = {
      value: svalue,
      title: "健康度",
      type: 1,
      radiusType: 1,
    };
    var fontColor = "#fff";
    var seriesName = "";
    let noramlSize = 16;
    let state = "";
    let center = ["50%", "70%"];
    let wqradius, nqradius, kdradius;

    wqradius = "100%";
    nqradius = "100%";
    kdradius = "100%";



    let wqColor = svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor();
    let nqColor = [
      [
        datas.value / 100,
        new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          {
            offset: 0,
            color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
          },
          {
            offset: 0.5,
            color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
          },
          {
            offset: 1,
            color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
          },
        ]),
      ],
      [1, "rgb(199, 222, 239)"],
    ];
    const option = {
      backgroundColor: "#f2f4f7",
      title: {
        //分配率文字配置
        show: true,
        x: "left",
        bottom: "-3%",
        left: "6%",
        text: cname,
        textStyle: {
          fontWeight: "500",
          fontSize: 14,
          color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor('rbd-content-color-secondary'),
        },
      },
      tooltip: {
        show: false
      },
      series: [
        {
          name: "刻度文字",
          type: "gauge",
          radius: "100%", //仪表盘大小
          center: ["50%", "74%"],
          startAngle: 180,
          endAngle: 0,
          z: 2,
          splitNumber: 5,
          min: 0,
          max: 100,
          axisTick: {
            show: false,
            lineStyle: {
              color: "#0af", //刻度线
              width: 1, //刻度线宽度
            },
            length: 3, //刻度线长度
            splitNumber: 1, //刻度线分割比例
          },
          splitLine: {
            show: false,
            length: 4,
            lineStyle: {
              color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
              width: 1,
              shadowBlur: 0.5,
              opacity: 0.9,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
            },
          },
          axisLine: {
            lineStyle: {
              color: nqColor,
              width: 10,
              opacity: 1,
            },
          },
          axisLabel: {
            distance: -40, //外层文字位置
            fontSize: 10, //文字大小
            color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(), //颜色
          },
          pointer: {
            show: false,
            width: 2, //指针
            length: "70%",
          },
          itemStyle: {
            normal: {
              //color: "#0af",//wqColor
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
                },
                {
                  offset: 0.5,
                  color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
                },
                {
                  offset: 1,
                  color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
                },
              ]),
            },
          },
          detail: {
            show: true,
            offsetCenter: [5, "-25%"], //显示数值的位置
            color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
            fontSize: 20,
            rich: {
              value: {
                fontSize: 20,
                lineHeight: 10,
                color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
                fontWeight: "700",
              },
              company: {
                fontSize: 10,
                lineHeight: 20,
                color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
              },
            },
            valueAnimation: true,
            formatter: "{value}%",
          },
          data: [
            {
              value: svalue,
            },
          ],
        },
        // 添加文本系列显示分配值和实际使用值
        {
          type: 'gauge',
          radius: '0%', // 隐藏实际图表
          z: 1,
          detail: {
            show: true,
            offsetCenter: [50, 51], //显示数值的位置
            color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor('rbd-content-color-secondary'),
            fontSize: 16,
            rich: {
              value: {
                fontSize: 16,
                lineHeight: 10,
                color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor('rbd-content-color-secondary'),
                fontWeight: "400",
              },
              company: {
                fontSize: 10,
                lineHeight: 20,
                color: svalue > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor('rbd-content-color-secondary'),
              },
            },
            valueAnimation: true,
            formatter: `{value}${unit}`,
          },
          pointer: {
            show: false
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          data: [
            {
              value: usedValue,
            },
          ],
        }
      ],
    };
    this.chart.setOption(option);
  };
  updateProgressGauge = () => {
    const { svalue, usedValue, unit } = this.props;
    const value = Number(svalue) || 0;
    const chartColor = value > 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor();
    const axisColor = global.getPublicColor('rbd-content-color-secondary');
    const option = {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '86%',
          center: ['50%', '50%'],
          progress: {
            show: true,
            width: 4,
            itemStyle: {
              color: chartColor
            }
          },
          axisLine: {
            lineStyle: {
              width: 4,
              color: [[1, global.getPublicColor('border-color-base')]]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: true,
            distance: 2,
            length: 5,
            lineStyle: {
              width: 1,
              color: axisColor
            }
          },
          axisLabel: {
            show: true,
            distance: 6,
            color: axisColor,
            fontSize: 9,
            formatter: value => value
          },
          pointer: {
            show: true,
            length: '48%',
            width: 3,
            itemStyle: {
              color: chartColor
            }
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 12,
            itemStyle: {
              color: '#fff',
              borderColor: chartColor,
              borderWidth: 4
            }
          },
          title: {
            show: false
          },
          detail: {
            valueAnimation: true,
            fontSize: 16,
            lineHeight: 22,
            color: global.getPublicColor('rbd-content-color'),
            offsetCenter: [0, '76%'],
            formatter: () => `${usedValue || 0}%`
          },
          data: [
            {
              value
            }
          ]
        }
      ]
    };
    this.chart.setOption(option, true);
  };
  render() {
    const { keys, swidth, sheight } = this.props
    return (
      <div id={keys + 'clusterInfo'} style={{ width: swidth, height: sheight }} />
    )
  }
}
