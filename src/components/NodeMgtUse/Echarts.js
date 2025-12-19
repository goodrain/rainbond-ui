import React, { Component } from 'react'
import global from '@/utils/global'
const echarts = require('echarts');

export default class Chart extends Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.loadTeamAppEcharts()
    }
    loadTeamAppEcharts = () => {
        const { keys, svalue, cname, uvalue } = this.props
        const echartsId = '#' + keys + 'clusterInfo'
        // 1.创建实例对象
        const myEcharts1 = echarts.init(document.querySelector(echartsId));
        // 2. options配置项
        const option = {
            title: [
                {
                    text: cname,
                    x: 'center',
                    top: '35%',
                    textStyle: {
                        color: svalue> 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor('rbd-content-color-secondary'),
                        fontSize: 14,
                        fontWeight: '600',
                    },
                },
                {
                    text: uvalue,
                    x: 'center',
                    top: '48%',
                    textStyle: {
                        fontSize: 18,
                        color: svalue> 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor('rbd-content-color-secondary'),
                        fontFamily: 'DINAlternate-Bold, DINAlternate',
                        fontWeight: '600',
                    },
                },
            ],
            backgroundColor: 'transparent',
            polar: {
                radius: ['55%', '70%'],
                center: ['50%', '50%'],
            },
            angleAxis: {
                max: 100,
                show: false,
            },
            radiusAxis: {
                type: 'category',
                show: true,
                axisLabel: {
                    show: false,
                },
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
            },
            series: [
                {
                    name: '',
                    type: 'bar',
                    roundCap: true,
                    barWidth: 30,
                    showBackground: true,
                    backgroundStyle: {
                        color: 'rgba(66, 66, 66, .3)',
                    },
                    data: [svalue],
                    coordinateSystem: 'polar',
                    itemStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                                {
                                    offset: 0,
                                    color: svalue> 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
                                },
                                {
                                    offset: 1,
                                    color: svalue> 80 ? global.getPublicColor('rbd-error-status') : global.getPublicColor(),
                                },
                            ]),
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
            <div id={keys + 'clusterInfo'} style={{ width: swidth, height: sheight }} />
        )
    }
}