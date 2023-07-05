<!--  -->
<template>
  <div class="input-auto-complete">
    <el-input
      v-model="input"
      :placeholder="placeholder"
      style="width: 250px"
      clearable
      @clear="init"
      @keyup.enter.native="init"
    >
      <i
        slot="prefix"
        class="el-input__icon el-icon-search"
        style="cursor: pointer"
        @click="init"
      />
    </el-input>
  </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component({
  name: 'InputAutoComplete',
})
export default class extends Vue {
  private input: any = ''
  @Prop({ default: [] }) data: Array<any>
  @Prop({ default: '' }) placeholder: string
  @Prop({ default: 'name' }) ObKey: string

  init() {
    this.$emit('init', this.input)
  }
}
</script>
<style scoped>
.input-auto-complete {
  display: inline-block;
}
</style>
