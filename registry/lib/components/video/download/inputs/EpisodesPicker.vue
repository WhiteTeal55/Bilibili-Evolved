<template>
  <div class="episodes-picker download-video-config-section">
    <div class="episodes-picker-header">
      <div class="episodes-picker-title">选集:</div>
      <div class="episodes-picker-checked-ratio">
        {{ checkedRatio }}
      </div>
      <div class="episodes-picker-actions">
        <VButton
          class="select-all"
          title="全选"
          type="transparent"
          @click="forEachItem(it => (it.isChecked = true))"
        >
          <VIcon :size="16" icon="mdi-checkbox-multiple-marked-circle" />
        </VButton>
        <VButton
          class="deselect-all"
          title="全不选"
          type="transparent"
          @click="forEachItem(it => (it.isChecked = false))"
        >
          <VIcon :size="16" icon="mdi-checkbox-multiple-blank-circle-outline" />
        </VButton>
        <VButton
          class="invert-selection"
          title="反选"
          type="transparent"
          @click="forEachItem(it => (it.isChecked = !it.isChecked))"
        >
          <VIcon :size="16" icon="mdi-circle-slice-4" />
        </VButton>
      </div>
    </div>
    <div class="episodes-picker-items">
      <div v-if="episodeItems.length === 0" class="episodes-picker-empty">
        <VEmpty />
      </div>
      <div v-for="(section, sectionIndex) of episodeSections" :key="sectionIndex">
        <div
          v-if="section.title"
          class="episodes-picker-section"
          :class="{ collapsed: section.isCollapsed }"
          :title="section.title"
          @click="toggleSection(section)"
        >
          <VIcon class="episodes-picker-section-toggle" :size="14" icon="mdi-chevron-down" />
          <span class="episodes-picker-section-title">{{ section.title }}</span>
          <span class="episodes-picker-section-ratio">{{ getSectionCheckedRatio(section) }}</span>
          <VButton
            class="select-section"
            title="全选此子合集"
            type="transparent"
            @click.stop="setSectionChecked(section, true)"
          >
            <VIcon :size="14" icon="mdi-checkbox-multiple-marked-circle" />
          </VButton>
          <VButton
            class="deselect-section"
            title="全不选此子合集"
            type="transparent"
            @click.stop="setSectionChecked(section, false)"
          >
            <VIcon :size="14" icon="mdi-checkbox-multiple-blank-circle-outline" />
          </VButton>
          <VButton
            class="invert-section"
            title="反选此子合集"
            type="transparent"
            @click.stop="invertSectionChecked(section)"
          >
            <VIcon :size="14" icon="mdi-circle-slice-4" />
          </VButton>
        </div>
        <transition
          name="episodes-picker-collapse"
          @enter="onSectionTransitionStart"
          @leave="onSectionTransitionStart"
          @after-enter="onSectionTransitionEnd"
          @after-leave="onSectionTransitionEnd"
        >
          <div v-show="!section.isCollapsed" class="episodes-picker-section-items">
            <div
              v-for="entry of section.entries"
              :key="entry.item.key"
              class="episodes-picker-item"
            >
              <CheckBox
                v-model="entry.item.isChecked"
                icon-position="left"
                :data-aid="entry.item.inputItem.aid"
                :data-cid="entry.item.inputItem.cid"
                :data-bvid="entry.item.inputItem.bvid"
                @click.native="shiftSelect($event, entry.item, entry.index)"
              >
                <span class="episode-title">
                  {{ entry.item.title }}
                </span>
                <span v-if="entry.item.durationText" class="episode-duration">
                  {{ entry.item.durationText }}
                </span>
              </CheckBox>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { VButton, VIcon, CheckBox, VEmpty } from '@/ui'
import { EpisodeItem } from './episode-item'

interface EpisodeSectionEntry {
  item: EpisodeItem
  index: number
}
interface EpisodeSection {
  title?: string
  isCollapsed: boolean
  entries: EpisodeSectionEntry[]
}

const buildEpisodeSections = (items: EpisodeItem[]) => {
  const sections: EpisodeSection[] = []
  items.forEach((item, index) => {
    const lastSection = sections[sections.length - 1]
    if (lastSection !== undefined && lastSection.title === item.sectionTitle) {
      lastSection.entries.push({ item, index })
      return
    }
    sections.push({ title: item.sectionTitle, isCollapsed: false, entries: [{ item, index }] })
  })
  return sections
}

export default Vue.extend({
  components: {
    VButton,
    VIcon,
    CheckBox,
    VEmpty,
  },
  props: {
    api: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      episodeItems: [] as EpisodeItem[],
      episodeSections: [] as EpisodeSection[],
      maxCheckedItems: 32,
      lastCheckedEpisodeIndex: -1,
    }
  },
  computed: {
    checkedRatio() {
      const checked: number = this.episodeItems.filter((it: EpisodeItem) => it.isChecked).length
      return `(${checked}/${this.episodeItems.length})`
    },
    inputItems() {
      return this.episodeItems.map((it: EpisodeItem) => it.inputItem)
    },
    checkedInputItems() {
      const items: EpisodeItem[] = this.episodeItems
      return items.filter(it => it.isChecked).map(it => it.inputItem)
    },
  },
  created() {
    this.getEpisodeItems()
  },
  methods: {
    // 展开/折叠前固定为内容高度, 结束值由 CSS 类提供
    onSectionTransitionStart(el: HTMLElement) {
      el.style.height = `${el.scrollHeight}px`
    },
    onSectionTransitionEnd(el: HTMLElement) {
      el.style.height = ''
    },
    toggleSection(section: EpisodeSection) {
      section.isCollapsed = !section.isCollapsed
    },
    getSectionCheckedRatio(section: EpisodeSection) {
      const checked = section.entries.filter(it => it.item.isChecked).length
      return `(${checked}/${section.entries.length})`
    },
    setSectionChecked(section: EpisodeSection, isChecked: boolean) {
      section.entries.forEach(it => {
        it.item.isChecked = isChecked
      })
    },
    invertSectionChecked(section: EpisodeSection) {
      section.entries.forEach(it => {
        it.item.isChecked = !it.item.isChecked
      })
    },
    shiftSelect(e: MouseEvent, item: EpisodeItem, index: number) {
      if (!e.shiftKey || this.lastCheckedEpisodeIndex === -1) {
        // console.log('set lastCheckedEpisodeIndex', index)
        this.lastCheckedEpisodeIndex = index
        return
      }
      if (e.shiftKey && this.lastCheckedEpisodeIndex !== -1) {
        ;(this.episodeItems as EpisodeItem[])
          .slice(
            Math.min(this.lastCheckedEpisodeIndex, index) + 1,
            Math.max(this.lastCheckedEpisodeIndex, index),
          )
          .forEach(it => {
            it.isChecked = !it.isChecked
          })
        // console.log(
        //   'shift toggle',
        //   Math.min(this.lastCheckedEpisodeIndex, index) + 1,
        //   Math.max(this.lastCheckedEpisodeIndex, index),
        // )
        this.lastCheckedEpisodeIndex = index
        e.preventDefault()
      }
    },
    forEachItem(action: (item: EpisodeItem, index: number) => void) {
      const items: EpisodeItem[] = this.episodeItems
      items.forEach(action)
    },
    async getEpisodeItems() {
      if (this.episodeItems.length > 0) {
        return
      }
      const items: EpisodeItem[] = await this.api(this)
      this.episodeItems = items
      this.episodeSections = buildEpisodeSections(items)
    },
  },
})
</script>
<style lang="scss">
@import 'common';
.episodes-picker {
  &-header {
    @include h-center();
  }
  &-checked-ratio {
    flex-grow: 1;
    margin-left: 4px;
  }
  &-actions {
    @include h-center();
    .be-button {
      padding: 4px;
      &.invert-selection .be-icon {
        font-size: 14px;
      }
      &.select-all .be-icon,
      &.deselect-all .be-icon {
        transform: translateY(1px);
      }
    }
  }
  &-items {
    max-height: 400px;
    overflow: auto;
    &:not(:empty) {
      margin-top: 4px;
      border: 1px solid #8884;
      border-radius: 6px;
    }
    .be-check-box {
      padding: 2px 6px;
    }
    .episode-duration {
      margin-right: 4px;
      text-align: right;
      flex: 1 1 0;
      opacity: 0.5;
    }
  }
  &-section {
    @include h-center();
    padding: 4px 6px;
    background-color: #8882;
    border-bottom: 1px solid #8882;
    cursor: pointer;
    user-select: none;
    &-toggle {
      flex-shrink: 0;
      margin-right: 2px;
      opacity: 0.7;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    &.collapsed &-toggle {
      transform: rotate(-90deg);
    }
    &-title {
      flex: 1 1 0;
      min-width: 0;
      @include single-line();
      @include semi-bold();
    }
    &-ratio {
      margin-left: 4px;
      opacity: 0.5;
    }
    .be-button {
      padding: 2px;
      margin-left: 2px;
      .be-icon {
        transform: translateY(1px);
      }
    }
  }
  &-section-items {
    overflow: hidden;
  }
  &-empty {
    @include h-center();
    justify-content: center;
    padding: 4px 0;
  }
}
.episodes-picker-collapse-enter-active,
.episodes-picker-collapse-leave-active {
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.episodes-picker-collapse-enter,
.episodes-picker-collapse-leave-to {
  height: 0 !important;
}
</style>
