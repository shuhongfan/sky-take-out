<template>
  <div
    :id="id"
    :class="className"
    :style="{height: height, width: width}"
  />
</template>

<script lang="ts">
import echarts, { EChartOption } from 'echarts';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';
import ResizeMixin from './mixins/resize';
import { WatchOptions } from 'vue';

    @Component({
        'name': 'MixedChart'
    })

export default class extends mixins(ResizeMixin) {
        @Prop({ 'default': 'chart' }) private className!: string
        @Prop({ 'default': 'mixedChart' }) private id!: string
        @Prop({ 'default': '100%' }) private width!: string
        @Prop({ 'default': '250px' }) private height!: string
        @Prop({ 'default': 'Requests' }) private title!: string
        @Prop({ 'default': {} }) private chartData!: any

        mounted() {
         this.init()
        }

        @Watch('chartData')
        private changeData(newVal:string ,oldVal:string){
          this.init()
        }

        init(){
          this.$nextTick(() => {
            this.initChart();
          });
        }

        beforeDestroy() {
            if (!this.chart) {
                return;
            }
            this.chart.dispose();
            this.chart = null;
        }
        private initChart() {
            this.chart = echarts.init(document.getElementById(this.id) as HTMLDivElement);
            this.chart.setOption({
                'backgroundColor': '#fff',
                'title': {
                    'text': this.title,
                    'top': '0',
                    'textStyle': {
                        'color': '#000',
                        'fontSize': 18
                    },
                    'subtextStyle': {
                        'color': '#90979c',
                        'fontSize': 16
                    }
                },
                'tooltip': {
                    'trigger': 'axis'
                },
                'grid': {
                    'left': '50',
                    'right': '5%',
                    'borderWidth': 0,
                    'top': 60,
                    'bottom': 34,
                    'textStyle': {
                        'color': '#fff'
                    }
                },
                'xAxis': [{
                    'type': 'category',
                    'axisLine': {
                        'lineStyle': {
                            'color': '#90979c'
                        }
                    },
                    'splitLine': {
                        'show': false
                    },
                    'axisTick': {
                        'show': true
                    },
                    'splitArea': {
                        'show': false
                    },
                    'axisLabel': {
                        'interval': 0,
                        'rotate':this.chartData.xData.length > 10 ? -25 : 0
                    },
                    'data': this.chartData.xData
                }],
                'yAxis': [{
                    'type': 'value',
                    'splitLine': {
                        'show': false
                    },
                    'axisLine': {
                        'lineStyle': {
                            'color': '#90979c'
                        }
                    },
                    'axisTick': {
                        'show': false
                    },
                    'axisLabel': {
                        'interval': 0
                    },
                    'splitArea': {
                        'show': false
                    }
                }],
                'series': [{
                    'name': '店内',
                    'type': 'bar',
                    'stack': 'total',
                    'barMaxWidth': 15,
                    'barGap': '10%',
                    'itemStyle': {
                        'normal': {
                            'barBorderRadius':[10, 10, 0, 0],
                            'color': new echarts.graphic.LinearGradient(
                                0, 0, 0, 1,
                                [
                                    {'offset': 0, 'color': '#FFA868'},
                                    {'offset': 1, 'color': '#FF9240'}
                                ]
                            )
                        },
                        'label': {
                            'show': true,
                            'textStyle': {
                                'color': '#fff'
                            },
                            'position': 'insideTop',
                            formatter(p: any) {
                                return p.value > 0 ? p.value : '';
                            }
                        }
                    },
                    'data': this.chartData.yData
                }]
            } as EChartOption<EChartOption.SeriesLine | EChartOption.SeriesBar>);
        }
}
</script>
