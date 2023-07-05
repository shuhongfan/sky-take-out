<!--  -->
<template>
  <div class="upload-item">
    <el-upload ref="uploadfiles"
               :accept="type"
               :class="{ borderNone: imageUrl }"
               class="avatar-uploader"
               action="/api/common/upload"
               :show-file-list="false"
               :on-success="handleAvatarSuccess"
               :on-remove="handleRemove"
               :on-error="handleError"
               :before-upload="beforeAvatarUpload"
               :headers="headers">
      <img v-if="imageUrl"
           :src="imageUrl"
           class="avatar">

      <i v-else
         class="el-icon-plus avatar-uploader-icon" />
      <span v-if="imageUrl"
            class="el-upload-list__item-actions">
        <span class="el-upload-span"
              @click.stop="oploadImgDel">
          删除图片
        </span>
        <span class="el-upload-span"> 重新上传 </span>
      </span>
    </el-upload>
    <p class="upload-tips">
      <slot />
    </p>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { baseUrl } from '@/config.json'
import { getToken } from '@/utils/cookies'
@Component({
  name: 'UploadImage'
})
export default class extends Vue {
  @Prop({ default: '.jpg,.jpeg,.png' }) type: string
  @Prop({ default: 2 }) size: number
  @Prop({ default: '' }) propImageUrl: string

  private headers = {
    token: getToken()
  }
  private imageUrl = ''
  handleRemove() {}

  @Watch('propImageUrl')
  private onChange(val) {
    this.imageUrl = val
  }

  handleError(err, file, fileList) {
    console.log(err, file, fileList, 'handleError')
    this.$message({
      message: '图片上传失败',
      type: 'error'
    })
  }

  handleAvatarSuccess(response: any, file: any, fileList: any) {
    // this.imageUrl = response.data
    // this.imageUrl = `http://172.17.2.120:8080/common/download?name=${response.data}`
    this.imageUrl = `${response.data}`
    // this.imageUrl = `${baseUrl}/common/download?name=${response.data}`

    this.$emit('imageChange', this.imageUrl)
  }

  oploadImgDel() {
    this.imageUrl = ''
    this.$emit('imageChange', this.imageUrl)
  }
  beforeAvatarUpload(file) {
    const isLt2M = file.size / 1024 / 1024 < this.size
    if (!isLt2M) {
      this.$message({
        message: `上传文件大小不能超过${this.size}M!`,
        type: 'error'
      })
      return false
    }
  }
}
</script>
<style lang='scss'>
.borderNone {
  .el-upload {
    border: 1px solid #d9d9d9 !important;
  }
}
</style>
<style scoped lang="scss">
.avatar-uploader .el-icon-plus:after {
  position: absolute;
  display: inline-block;
  content: ' ' !important;
  left: calc(50% - 20px);
  top: calc(50% - 40px);
  width: 40px;
  height: 40px;
  background: url('./../../assets/icons/icon_upload@2x.png') center center
    no-repeat;
  background-size: 20px;
}

.el-upload-list__item-actions:hover .upload-icon {
  display: inline-block;
}
.el-icon-zoom-in:before {
  content: '\E626';
}
.el-icon-delete:before {
  content: '\E612';
}
.el-upload-list__item-actions:hover {
  opacity: 1;
}
.upload-item {
  display: flex;
  align-items: center;
  .el-form-item__content {
    width: 500px !important;
  }
}
.upload-tips {
  font-size: 12px;
  color: #666666;
  display: inline-block;
  line-height: 17px;
  margin-left: 36px;
}
.el-upload-list__item-actions {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: default;
  text-align: center;
  color: #fff;
  opacity: 0;
  font-size: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader {
  display: inline-block;
}

.avatar-uploader .el-upload:hover {
  border-color: #ffc200;
}
.el-upload-span {
  width: 100px;
  height: 30px;
  border: 1px solid #ffffff;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  line-height: 30px;
}

.el-upload-span:first-child {
  margin-bottom: 20px;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 160px;
  line-height: 160px;
  text-align: center;
}

.avatar {
  width: 200px;
  height: 160px;
  display: block;
}
</style>
