<template>
  <div class="dashboard-container">
    <div class="informBox">
      <ul class="conTab">
        <li
          v-for="(item, index) in tabList"
          :key="index"
          :class="activeIndex === index ? 'active' : ''"
          @click="handleClass(index)"
        >
          <el-badge
            class="item"
            :class="ountUnread >= 10 ? 'badgeW' : ''"
            :value="
              ountUnread === 0 ? null : ountUnread > 99 ? '99+' : ountUnread
            "
            :hidden="!([1].includes(item.value) && ountUnread)"
            >{{ item.label }}</el-badge
          >
        </li>
      </ul>

      <el-button
        icon="iconfont icon-clear"
        class="right-el-button"
        v-if="status === 1 && baseData.length > 0"
        @click="handleBatch"
        >全部已读</el-button
      >
      <el-button
        icon="iconfont icon-clear"
        class="right-el-button onbutton"
        disabled
        v-else
        >全部已读</el-button
      >
    </div>
    <div class="container newBox" :class="{ hContainer: baseData.length }">
      <div class="informList" v-if="baseData.length > 0">
        <div v-for="(item, index) in baseData" :key="index">
          <!-- 待接单 -->
          <div class="item" v-if="item.type === 1">
            <div class="tit">
              <span>【待接单】</span>{{ item.arrNew[0]
              }}<span class="fontOrderTip" @click="handleSetStatus(item.id)">
                <router-link :to="'/order?status=' + 2">{{
                  item.arrNew[1]
                }}</router-link></span
              >{{ item.arrNew[2]
              }}<span class="time">{{ item.createTime }}</span>
            </div>
          </div>
          <div class="item" v-if="item.type === 2">
            <div class="tit">
              <i>急</i><span>【待接单】</span>{{ item.arrNew[0]
              }}<span class="fontOrderTip" @click="handleSetStatus(item.id)"
                ><router-link :to="'/order?status=' + 2">{{
                  item.arrNew[1]
                }}</router-link></span
              >{{ item.arrNew[2]
              }}<span class="time">{{ item.createTime }}</span>
            </div>
          </div>
          <!-- end -->
          <!-- 待派送 -->
          <div class="item" v-if="item.type === 3">
            <div class="tit">
              <span>【待派送】</span>{{ item.arrNew[0]
              }}<span class="fontOrderTip" @click="handleSetStatus(item.id)"
                ><router-link :to="'/order?status=' + 2">{{
                  item.arrNew[1]
                }}</router-link></span
              >{{ item.arrNew[2]
              }}<span class="time">{{ item.createTime }}</span>
            </div>
          </div>
          <!-- end -->
          <!-- 催单 -->
          <div
            class="item"
            v-if="item.type === 4"
            @mouseenter="toggleShow(item.id, index)"
            @mouseleave="mouseLeaves(index)"
          >
            <div :class="isActive ? 'titAlready' : ''">
              <div class="tit">
                <span>【催单】</span>{{ item.arrNew[0] }}
                <!-- <span
                  class="fontOrderTip"
                  >去处理</span
                > -->
                <span class="time">{{ item.createTime }}</span>
              </div>
              <div v-if="shopShow && showIndex === index" class="orderInfo">
                <p>
                  <span
                    ><label>下单时间：</label>{{ item.details.orderTime }}</span
                  ><span
                    ><label>预计送达时间：</label
                    >{{ item.details.estimatedDeliveryTime }}</span
                  >
                </p>
                <p>
                  {{ item.details.consignee }}，{{ item.details.phone }}，{{
                    item.details.address
                  }}
                </p>
                <p>
                  <span
                    ><label>菜品：</label>{{ item.details.orderDishes }}</span
                  >
                </p>
              </div>
            </div>
          </div>
          <!-- end -->
          <!-- <div class="item" v-if="item.type === 4 && isActive && status === 1">
            <div class="titAlready">
              <div class="tit">
                <span>【催单】</span>{{ item.arrNew[0] }}
                <span class="time">{{ item.createTime }}</span>
              </div>
            </div>
          </div> -->
          <!-- 闭店 -->
          <!-- <div class="item" v-if="item.type === 5 && isActive && status === 1">
            <div class="titAlready">
              <div class="tit">
                <span>【今日数据】</span>认真工作的同时也要好好生活。<span
                  class="time"
                  >{{ item.createTime }}</span
                >
              </div>
            </div>
          </div> -->
          <div
            class="item"
            v-if="item.type === 5"
            @mouseenter="toggleShow(item.id, index)"
            @mouseleave="mouseLeaves(index)"
          >
            <div :class="isActive ? 'titAlready' : ''">
              <div class="tit">
                <span>【今日数据】</span>认真工作的同时也要好好生活。<span
                  class="time"
                  >{{ item.createTime }}</span
                >
              </div>
              <div v-if="shopShow && showIndex === index" class="orderInfo">
                <p>
                  <span
                    ><label>营业额：</label>{{ item.details.turnover }}</span
                  >
                  <span
                    ><label>有效订单：</label
                    >{{ item.details.validOrderCount }}笔</span
                  >
                  <span
                    ><label>订单完成率：</label
                    >{{ item.details.orderCompletionRate }}</span
                  >
                </p>
                <p>
                  <span
                    ><label>今日新增用户：</label
                    >{{ item.details.newUsers }}</span
                  >
                  <span
                    ><label>今日取消：</label
                    >{{ item.details.cancelledOrders }}笔</span
                  >
                  <span
                    ><label>今日取消金额：</label>￥{{
                      item.details.cancelledAmount
                    }}</span
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
        <!-- end -->
      </div>
      <Empty v-else :is-search="isSearch" />
      <el-pagination
        v-if="counts > 10"
        class="pageList"
        :page-sizes="[10, 20, 30, 40]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="counts"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Inject } from 'vue-property-decorator'
import Empty from '@/components/Empty/index.vue'
import { getNewData, setNewData } from '@/utils/cookies'
import { AppModule } from '@/store/modules/app'
// 接口
import {
  getInformData,
  batchMsg,
  setStatus,
  getCountUnread,
} from '@/api/inform'
@Component({
  name: 'Inform',
  components: {
    Empty,
  },
})
export default class extends Vue {
  // @Inject('reload') readonly reload!: Function
  private activeIndex = 0
  private shopShow = false
  private counts: number = 0
  private page: number = 1
  private pageSize: number = 10
  private status = 1
  private baseData = []
  // private ountUnread = 0 as any
  private showIndex = 0
  private isSearch: boolean = false
  private isActive: boolean = false

  get tabList() {
    return [
      {
        label: '未读',
        value: 1,
        // num: this.ountUnread,
      },
      {
        label: '已读',
        value: 2,
        // num: 0,
      },
    ]
  }
  get ountUnread() {
    return AppModule.statusNumber
  }
  created() {
    this.getData()
  }
  // 获取列表数据
  async getData() {
    const parent = {
      pageNum: this.page,
      pageSize: this.pageSize,
      status: this.status,
    }
    const { data } = await getInformData(parent)
    if (data.code === 1) {
      this.baseData = data.data.records
      this.counts = data.data.total
      let objNew = {} as any
      let arrDetails = []
      this.baseData.forEach((val) => {
        // 处理后端返回的状订单字符串转义
        const arrContent = val.content.split(' ')
        // 处理催单、闭店详情数据
        val.arrNew = arrContent
        objNew = { ...val }
        objNew.details = eval('(' + objNew.details + ')')
        arrDetails.push(objNew)
      })

      this.baseData = arrDetails
      // this.$message.success('操作成功！')
    } else {
      this.$message.error(data.msg)
    }
  }

  // 全部已读
  async handleBatch() {
    const ids = []
    this.baseData.forEach((val) => {
      ids.push(val.id)
    })
    const { data } = await batchMsg(ids)
    if (data.code === 1) {
      // this.status = 2
      // this.activeIndex = 1
      this.getCountUnread()
      this.getData()
      // this.$message.success('操作成功！')
    } else {
      this.$message.error(data.msg)
    }
  }
  // 设置单个订单已读
  async handleSetStatus(id) {
    const { data } = await setStatus(id)
    if (data.code === 1) {
      // this.status = 2
      // this.activeIndex = 1
      if (!this.isActive) {
        this.getCountUnread()
        this.getData()
      }

      // this.reload()
      // this.$message.success('操作成功！')
    } else {
      this.$message.error(data.msg)
    }
  }
  // 获取未读消息
  async getCountUnread() {
    const { data } = await getCountUnread()
    if (data.code === 1) {
      AppModule.StatusNumber(data.data)
      // this.$message.success('操作成功！')
    } else {
      this.$message.error(data.msg)
    }
  }
  // 触发已读未读按钮
  handleClass(index) {
    this.activeIndex = index
    if (index === 0) {
      this.status = 1
    } else {
      this.status = 2
    }
    this.getData()
  }
  // 下拉菜单显示
  toggleShow(id, index) {
    this.shopShow = true
    this.showIndex = index
    let t = 3
    let timer = setInterval(() => {
      t--
      if (t === 0) {
        if (this.status === 1) {
          this.isActive = true
          this.handleSetStatus(id)
        }

        clearInterval(timer)
      }
    }, 1000)
  }
  // 下拉菜单隐藏
  mouseLeaves(index) {
    this.shopShow = false
    this.showIndex = index
  }
  private handleSizeChange(val: any) {
    this.pageSize = val
    this.getData()
  }

  private handleCurrentChange(val: any) {
    this.page = val
    this.getData()
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 30px;
    .container {
      background: #fff;
      position: relative;
      z-index: 1;
      padding: 0 30px;
      border-radius: 4px;
      // min-height: 650px;
      height: calc(100% - 55px);
      overflow: hidden;
      &.newBox {
        // padding:0;
        .pageList {
          border-top: 1px solid #f3f4f7;
          padding: 40px;
          margin-top: 0;
        }
      }
    }
    .hContainer {
      height: auto !important;
    }
  }
}
</style>