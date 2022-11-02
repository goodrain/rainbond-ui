import React, { Component } from 'react'
const echarts = require('echarts');

export default class Chart extends Component {
    constructor(props){
        super(props)
    }
    
    componentDidMount(){
        this.loadTeamAppEcharts()
    }
    loadTeamAppEcharts = () => {
        const {keys, svalue, cname} = this.props
        const echartsId = '#'+ keys +'clusterInfo'
        // 1.创建实例对象
        const myEcharts1 = echarts.init(document.querySelector(echartsId));
        // 2. options配置项
        var datas = {
            value: 80,
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
      
        
      
          let wqColor = "rgba(80, 152, 237,0.9)";
          let nqColor = [
            [
              datas.value / 100,
              new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: "#3d54c4",
                },
                {
                  offset: 0.5,
                  color: "#3d54c4",
                },
                {
                  offset: 1,
                  color: "#3d54c4",
                },
              ]),
            ],
            [1, "rgb(199, 222, 239)"],
          ];
        const option = {
            backgroundColor:"#F7FAFE",
            title: {
              //分配率文字配置
              show: true,
              x: "left",
              bottom: "-3%",
              left: "14%",
              text: cname,
              textStyle: {
                fontWeight: "500",
                fontSize: 12,
                color: "#79828f",
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
                },
                axisLine: {
                  lineStyle: {
                    width: 25,
                    opacity: 0,
                  },
                },
                axisLabel: {
                  distance: -34, //外层文字位置
                  fontSize: 10, //文字大小
                  color: "#3d54c4", //颜色
                },
                pointer: {
                  show: true,
                  width: 2, //指针
                  length: "70%",
                },
                itemStyle: {
                  normal: {
                    //color: "#0af",//wqColor
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                      {
                        offset: 0,
                        color: "#3d54c4",
                      },
                      {
                        offset: 0.5,
                        color: "#3d54c4",
                      },
                      {
                        offset: 1,
                        color: "#3d54c4",
                      },
                    ]),
                  },
                },
                detail: {
                  show: true,
                  offsetCenter: [24, "39%"], //显示数值的位置
                  color: "#3d54c4",
                  fontSize: 20,
                  rich: {
                    value: {
                      fontSize: 20,
                      lineHeight: 10,
                      color: "#3d54c4",
                      fontWeight: "700",
                    },
                    company: {
                      fontSize: 10,
                      lineHeight: 20,
                      color: "#3d54c4",
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
              {
                name: "内层盘",
                type: "gauge",
                z: 2,
                radius: "85%",
                startAngle: 180,
                endAngle: 0,
                center: ["49%", "70%"],
                axisLine: {
                  lineStyle: {
                    color: nqColor,
                    width: 10,
                    opacity: 1,
                  },
                },
                splitNumber: 5,
                min: 0,
                max: 100,
                axisTick: {
                  show: false,
                },
                splitLine: {
                  show: true,
                  length: 4,
                  lineStyle: {
                    color: "#3d54c4",
                    width: 1,
                    shadowBlur: 0.5,
                    opacity: 0.9,
                    shadowOffsetX:0,
                    shadowOffsetY: 0,
                  },
                },
                itemStyle: {
                  //指针阴影
                  shadowBlur: 10,
                  shadowColor: "rgba(0, 103, 255, 0.2)",
                  shadowOffsetX: 0,
                  shadowOffsetY: 8,
                },
                axisLabel: {
                  show: false,
                },
                pointer: {
                  show: false,
                },
      
                detail: {
                  show: false,
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
    const {keys, swidth, sheight} = this.props
    return (
        <div id={keys + 'clusterInfo'} style={{width: swidth,height: sheight}} />
    )
  }
}

