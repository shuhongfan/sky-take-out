<template>
  <div class="container top10">
    <h2 class="homeTitle">销量排名TOP10</h2>
    <div class="charBox">
      <div id="top" style="width: 100%; height: 380px"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import * as echarts from 'echarts'
@Component({
  name: 'Top',
})
export default class extends Vue {
  @Prop() private top10data!: any
  @Watch('top10data')
  getData() {
    this.$nextTick(() => {
      this.initChart()
    })
  }
  initChart() {
    type EChartsOption = echarts.EChartsOption
    const chartDom = document.getElementById('top') as any
    const myChart = echarts.init(chartDom)
    var option: any
    option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff', //背景颜色（此时为默认色）
        borderRadius: 2, //边框圆角
        textStyle: {
          color: '#333', //字体颜色
          fontSize: 12, //字体大小
          fontWeight: 300,
        },
      },
      grid: {
        top: '-10px',
        left: '0',
        right: '0',
        bottom: '0',
        containLabel: true,
      },
      xAxis: {
        show: false,
      },
      yAxis: {
        //   隐藏y轴坐标轴
        axisLine: {
          show: false,
        },
        // 隐藏y轴刻度线
        axisTick: {
          show: false,
          alignWithLabel: true,
        },
        type: 'category',
        // interval: 100,
        axisLabel: {
          textStyle: {
            color: '#666',
            fontSize: '12px',
          },
          // formatter: "{value} ml",//单位
        },
        data: this.top10data.nameList,
      },
      series: [
        {
          data: this.top10data.numberList,
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: '#F3F4F7',
          },
          barWidth: 20,
          barGap: '80%' /*多个并排柱子设置柱子之间的间距*/,
          barCategoryGap: '80%' /*多个并排柱子设置柱子之间的间距*/,

          itemStyle: {
            emphasis: {
              barBorderRadius: 30,
            },
            normal: {
              barBorderRadius: [0, 10, 10, 0], // 圆角
              color: new echarts.graphic.LinearGradient( // 渐变色
                1,
                0,
                0,
                0, // 渐变色的起止位置, 右/下/左/上
                [
                  // offset 位置
                  { offset: 0, color: '#FFBD00' },
                  { offset: 1, color: '#FFD000' },
                ]
              ),
              label: {
                //内容样式
                show: true,
                formatter: '{@score}',
                color: '#333',
                // position: "insideLeft", //内部左对齐
                position: ['8', '5'], //自定义位置第一个参数为x轴方向，第二个参数为y轴方向，左上角为起点，向右向下为正数，向上向左为负数
              },
            },
          },
          // label: {
          //   show: true,
          //   position: "left",
          //   valueAnimation: true,
          // },
        },
      ],
    }
    option && myChart.setOption(option)
  }
}
</script>
