<template>
  <div
    :id="id"
    :class="className"
    :style="{height: height, width: width}"
  />
</template>

<script lang="ts">
import echarts, { EChartOption } from 'echarts';
import {Component, Prop, Watch} from 'vue-property-decorator';
import { mixins } from 'vue-class-component';
import ResizeMixin from './mixins/resize';
    @Component({
        'name': 'BarChart'
    })
export default class extends mixins(ResizeMixin) {
        @Prop({ 'default': 'chart' }) private className!: string
        @Prop({ 'default': 'BarChart' }) private id!: string
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

        private init(){
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

            const data = this.chartData;

            this.chart.setOption({'title': {
                'text': this.title,
                'left': 'left'
            },
            'tooltip': {
                'trigger': 'item',
                'formatter': '{a} <br/>{b} : {c} ({d}%)'
            },
            'legend': {
                'type': 'scroll',
                'orient': 'vertical',
                'left': 0,
                'top': 50,
                'bottom': 20,
                'data': data.legendData,
                'selected': data.selected
            },
            'series': [
                {
                    'name': '占比',
                    'type': 'pie',
                    'radius': '65%',
                    'left':80,
                    'center': ['40%', '50%'],
                    'data': data.seriesData,
                    'emphasis': {
                        'itemStyle': {
                            'shadowBlur': 10,
                            'shadowOffsetX': 0,
                            'shadowColor': 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    'itemStyle': {
                        'normal': {
                            'color': function (params:any) {
                                var colorList = ['#389BFF', '#FFC200', '#52C41A', '#08979C', '#597EF7', '#B37FEB','#FF7875', '#5CDBD3', '#FFC53D'];
                                return colorList[params.dataIndex];
                            }
                        }
                    }
                }
            ]} as any);
        }
}
</script>
