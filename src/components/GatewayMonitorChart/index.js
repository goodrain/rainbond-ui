import React, { Component } from 'react'
const echarts = require('echarts');

export default class GatewayMonitorChart extends Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.loadGatewayMonitorEcharts()
    }
    componentDidUpdate(prevProps) {
        // 检查数据属性是否发生变化，并在需要时触发重新渲染
        if (this.props.data !== prevProps.data) {
            // 执行任何必要的图表更新逻辑
            this.loadGatewayMonitorEcharts();
        }
    }

    
    tooltipFormatter = (params) => {
        const { keys, changeTwoDecimal } = this.props
        var tooltip = params[0].name + '<br/>';
        params.forEach((item) => {
            var valueInMB = keys == 'flow' ? (changeTwoDecimal(item.value / 1024 / 1024) + 'MB')
                : keys == 'delay' ?
                    (Math.round(item.value / 1000) + 's')
                    : keys == 'qps' ?
                        (item.value + '次/s')
                        : keys == 'error_rate' ?
                            (item.value + '次/s')
                            : item.value;
            tooltip += `<div style=\"display:flex;justify-content: space-between;\">
                <div>
                    ${item.marker}
                    <span>${item.seriesName}</span>
                </div>
                <div style=\"margin-left: 12px\">
                    ${valueInMB}
                </div>
            </div>`
        });
        return tooltip;
    };
    loadGatewayMonitorEcharts = () => {
        const { keys, svalue, cname, chartTitle, data, changeTwoDecimal } = this.props
        const echartsId = '#' + keys + 'gatewayMonitor'
        // 1.创建实例对象
        const myEcharts1 = echarts.init(document.querySelector(echartsId));
        // 2. options配置项
        const seriesArr = [];
        let routeArr = data.map((item) => {
            return item.route;
        });
        data.map((item, index) => {
            const seriesItem = {
                name: item.route,
                type: 'line',
                data: item.values,
                symbolSize: 0.5,
                symbol: 'circle',
                smooth: true,
                yAxisIndex: 0,
                showSymbol: false,
                emphasis: {
                    focus: 'series',
                },
                lineStyle: {
                    width: 1,
                    shadowColor: 'rgba(158,135,255, 0.3)',
                    shadowBlur: 10,
                    shadowOffsetY: 15,
                },
                itemStyle: {
                    normal: {
                        color: item.color,
                        borderColor: item.color,
                    },
                },
            };
            seriesArr.push(seriesItem);
        })


        const option = {
            backgroundColor: '#fff',
            title: {
                text: chartTitle,
                textStyle: {
                    fontSize: 16,
                    fontWeight: 500,
                },
                left: '7%',
                top: '5%',
                show: true,
            },
            legend: {
                bottom: '2%', //图例距离底部的距离
                orient: 'horizontal', //图例方向【horizontal/vertical】
                selectedMode: true, //允许点击图例 true / false
                itemGap: 4, //图例之间的距离
                data: routeArr, //图例的数据数组
            },
            tooltip: {
                trigger: 'axis',
                type: 'cross',
                axisPointer: {
                    label: {
                        show: true,
                        backgroundColor: '#fff',
                        color: '#556677',
                        borderColor: 'rgba(0,0,0,0)',
                        shadowColor: 'rgba(0,0,0,0)',
                        shadowOffsetY: 0,
                    },
                    lineStyle: {
                        width: 0,
                    },
                },
                formatter: this.tooltipFormatter,
                backgroundColor: '#fff',
                textStyle: {
                    color: '#5c6c7c',
                },
                padding: [10, 10],
                extraCssText: 'box-shadow: 1px 0 2px 0 rgba(163,163,163,0.5)',
            },
            grid: {
                top: '15%',
                y2: 96,
            },
            xAxis: {
                type: 'category',
                data: data[0].timeStamps,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    textStyle: {
                        color: '#393939', //X轴文字颜色
                    }
                },
            },
            yAxis: [
                {
                    type: 'value',
                    axisTick: {
                        show: false,
                    },
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: '#DCE2E8',
                        },
                    },
                    axisLabel: {
                        formatter: (value) => {
                            if (keys == 'qps') {
                                return value + ' 次/s'
                            } else if (keys == 'flow') {
                                return changeTwoDecimal(value / 1024 / 1024) + ' MB/s'
                            } else if (keys == 'error_rate') {
                                return value + ' 次/s'
                            } else {
                                return Math.round(value / 1000) + ' s'
                            }
                        },
                        textStyle: {
                            color: '#556677',
                        },
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: 'dashed',
                        },
                    },
                },
            ],
            series: [
                {
                    name: '处理任务数',
                    type: 'line',
                    data: data5,
                    symbolSize: 1,
                    symbol: 'circle',
                    yAxisIndex: 0,
                    showSymbol: false,
                    emphasis: {
                        focus: 'series',
                    },
                    lineStyle: {
                        width: 1,
                        shadowColor: 'rgba(158,135,255, 0.3)',
                        shadowBlur: 10,
                        shadowOffsetY: 15,
                    },
                    itemStyle: {
                        normal: {
                            color: colorList[0],
                            borderColor: colorList[0],
                        },
                    },

                },
                {
                    name: '回退数',
                    type: 'line',
                    data: data2,
                    symbolSize: 1,
                    symbol: 'circle',
                    yAxisIndex: 0,
                    showSymbol: false,
                    emphasis: {
                        focus: 'series',
                    },
                    lineStyle: {
                        width: 1,
                        shadowColor: 'rgba(115,221,255, 0.3)',
                        shadowBlur: 10,
                        shadowOffsetY: 15,
                    },
                    itemStyle: {
                        normal: {
                            color: colorList[1],
                            borderColor: colorList[1],
                        },
                    },

                },
                {
                    name: '被回退数',
                    type: 'line',
                    data: data1,
                    symbolSize: 1,
                    yAxisIndex: 0,
                    symbol: 'circle',
                    showSymbol: false,
                    emphasis: {
                        focus: 'series',
                    },
                    lineStyle: {
                        width: 1,
                        shadowColor: 'rgba(254,154,139, 0.3)',
                        shadowBlur: 10,
                        shadowOffsetY: 15,
                    },
                    itemStyle: {
                        normal: {
                            color: colorList[2],
                            borderColor: colorList[2],
                        },
                    },

                },
            ],
        };

        // 3. 配置项和数据给实例化对象
        myEcharts1.setOption(option);
        // 4. 当我们浏览器缩放的时候，图表也等比例缩放
        window.addEventListener('resize', function () {
            // 让我们的图表调用 resize这个方法
            myEcharts1.resize();
        });
    };
    render() {
        const { keys, swidth, sheight } = this.props
        return (
            <div id={keys + 'gatewayMonitor'} style={{ width: swidth, height: sheight }} />
        )
    }
}