<template>
  <div class="tip-wrap be-live-screenshot-tip">
    <div class="tip panel">截图</div>
    <button class="be-live-screenshot-button">
      <VIcon :size="24" icon="mdi-camera"></VIcon>
    </button>
  </div>
</template>
<script lang="ts">
import { VIcon } from '@/ui'

export default Vue.extend({
  components: {
    VIcon,
  },
})
</script>
<style lang="scss">
.be-live-screenshot-tip.tip-wrap {
  position: relative;

  // 复用直播播放器原生按钮提示框的样式 (.tip-wrap / .tip.panel),
  // 这里只补充原生 scoped 样式未提供的显隐动画和文本布局。
  // 动画与原生一致: 200ms cubicOut, 从下方 10px 滑入并淡入到 0.9 不透明度。
  // 用独立的 translate 属性做位移, 避免覆盖 .panel 用于定位的 transform。
  .tip.panel {
    visibility: hidden;
    opacity: 0;
    translate: 0 10px;
    padding: 6px 10px;
    line-height: 21px;
    white-space: nowrap;
    word-break: keep-all;
    transition: visibility 0.2s cubic-bezier(0.215, 0.61, 0.355, 1),
      opacity 0.2s cubic-bezier(0.215, 0.61, 0.355, 1),
      translate 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  &:hover .tip.panel {
    visibility: visible;
    opacity: 0.9;
    translate: 0 0;
  }
}

.be-live-screenshot-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  background-color: transparent;
  color: #fff;
  cursor: pointer;
  outline: none !important;
  .be-icon {
    color: #fff;
    fill: #fff;
  }
}
</style>
