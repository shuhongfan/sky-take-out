<template>
  <div
    :id="id"
    :class="className"
    :style="{height: height, width: width}"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import echarts from 'echarts';

import { mixins } from 'vue-class-component';
import ResizeMixin from './mixins/resize';

    @Component({
        'name': 'LineChart'
    })
export default class extends mixins(ResizeMixin) {
        @Prop({ 'default': 'chart' }) private className!: string
        @Prop({ 'default': 'chart' }) private id!: string
        @Prop({ 'default': '100%' }) private width!: string
        @Prop({ 'default': '300px' }) private height!: string
        @Prop({ 'default': 'Requests' }) private title!: string

        mounted() {
            this.$nextTick(() => {
                this.initChart();
            });
        }

        private initChart() {
            this.chart = echarts.init(document.getElementById(this.id) as HTMLDivElement);
            this.chart.setOption({
                'backgroundColor': '#fff',
                'title': {
                    'top': 20,
                    'text': this.title,
                    'textStyle': {
                        'fontWeight': 'normal',
                        'fontSize': 16,
                        'color': '#000'
                    },
                    'left': '1%'
                },
                'tooltip': {
                    'trigger': 'axis'
                },
                'legend': {
                    'top': 20,
                    'icon': 'rect',
                    'itemWidth': 14,
                    'itemHeight': 5,
                    'itemGap': 13,
                    'data': ['CMCC', 'CTCC'],
                    'right': '4%',
                    'textStyle': {
                        'fontSize': 12,
                        'color': '#000'
                    }
                },
                'grid': {
                    'top': 100,
                    'left': '2%',
                    'right': '2%',
                    'bottom': '2%',
                    'containLabel': true
                },
                'xAxis': [{
                    'type': 'category',
                    'boundaryGap': false,
                    'axisLine': {
                        'lineStyle': {
                            'color': '#57617B'
                        }
                    },
                    'axisLabel': {
                        'interval': 0,
                        'rotate':-20
                    },
                    'data': ['13:00', '13:05', '13:10', '13:15', '13:20', '13:25', '13:30', '13:35', '13:40', '13:45', '13:50', '13:55']
                }],
                'yAxis': [{
                    'type': 'value',
                    'name': '(%)',
                    'axisTick': {
                        'show': false
                    },
                    'axisLine': {
                        'lineStyle': {
                            'color': '#57617B'
                        }
                    },
                    'axisLabel': {
                        'margin': 10,
                        'fontSize': 14
                    },
                    'splitLine': {
                        'lineStyle': {
                            'color': '#EEF3F8'
                        }
                    }
                }],
                'series': [{
                    'name': 'CMCC',
                    'type': 'line',
                    'smooth': true,
                    'symbol': 'circle',
                    'symbolSize': 5,
                    'showSymbol': false,
                    'lineStyle': {
                        'width': 2
                    },
                    'areaStyle': {
                        'color': new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            'offset': 0,
                            'color': 'rgba(255, 140, 54, 0.3)'
                        }, {
                            'offset': 0.8,
                            'color': 'rgba(255, 140, 54, 0)'
                        }], false),
                        'shadowColor': 'rgba(0, 0, 0, 0.1)',
                        'shadowBlur': 10
                    },
                    'itemStyle': {
                        'color': '#FF783D',
                        'borderColor': '#FF783D',
                        'borderWidth': 12
                    },
                    'data': [220, 182, 191, 134, 150, 120, 110, 125, 145, 122, 165, 122]
                }]
            } as any);
        }
}
</script>

<style lang="scss" scoped>

</style>
