import { defineComponentMetadata } from '@/components/define'
import { waitForControlBar } from '@/components/live/live-control-bar'
import { mountVueComponent } from '@/core/utils'
import { liveUrls } from '@/core/utils/urls'
import { KeyBindingAction } from '../../utils/keymap/bindings'
import { Screenshot, ScreenshotDisabledClass } from '../../common/screenshot/screenshot'
import ScreenshotContainer from '../../common/screenshot/ScreenshotContainer.vue'
import LiveScreenshotButton from './LiveScreenshotButton.vue'

const buttonClass = 'be-live-screenshot-button'

let screenShotsList: Vue & {
  screenshots: Screenshot[]
}
let screenshotButton: HTMLElement
let enabled = false

const exitConfirmHandler = (e: BeforeUnloadEvent) => {
  if (screenShotsList?.screenshots.length > 0) {
    e.preventDefault()
  }
}

/** 直播已持续的时间, 直接取控制栏上显示的时间 */
const getLiveDuration = () => {
  const timeText = dq('.control-area .text.time')?.textContent?.trim()
  return timeText || undefined
}

const takeLiveScreenshot = async () => {
  const video = dq('.live-player-mounter video, .live-player-ctnr video') as HTMLVideoElement
  if (!(video instanceof HTMLVideoElement)) {
    const { logError } = await import('@/core/utils/log')
    logError('直播截图失败: 无法定位直播视频元素.')
    return
  }
  const screenshot = new Screenshot(video, video.currentTime, false, getLiveDuration())
  if (!screenShotsList) {
    screenShotsList = mountVueComponent(ScreenshotContainer)
    document.body.insertAdjacentElement('beforeend', screenShotsList.$el)
  }
  screenShotsList.screenshots.unshift(screenshot)
}

const insertScreenshotButton = (controlBar: HTMLElement) => {
  if (!enabled || dq(controlBar, `.${buttonClass}`)) {
    return
  }
  if (!screenshotButton) {
    screenshotButton = mountVueComponent(LiveScreenshotButton).$el as HTMLElement
    const button = screenshotButton.querySelector('button') as HTMLButtonElement
    button.addEventListener('click', takeLiveScreenshot)
  }
  const volume = dq(controlBar, '.volume') as HTMLElement
  if (volume) {
    volume.insertAdjacentElement('afterend', screenshotButton)
    return
  }
  const leftArea = dq(controlBar, '.left-area') as HTMLElement
  ;(leftArea ?? controlBar).appendChild(screenshotButton)
}

const entry = () => {
  enabled = true
  waitForControlBar({ callback: insertScreenshotButton })
  window.addEventListener('beforeunload', exitConfirmHandler)
}

export const component = defineComponentMetadata({
  name: 'liveScreenshot',
  displayName: '启用直播截图',
  author: {
    name: 'WhiteTeal55',
    link: 'https://github.com/WhiteTeal55',
  },
  tags: [componentsTags.live],
  entry,
  urlInclude: liveUrls,
  reload: () => {
    enabled = true
    document.body.classList.remove(ScreenshotDisabledClass)
    window.addEventListener('beforeunload', exitConfirmHandler)
    const controlBar = dq('.control-area') as HTMLElement
    if (controlBar) {
      insertScreenshotButton(controlBar)
    }
  },
  unload: () => {
    enabled = false
    document.body.classList.add(ScreenshotDisabledClass)
    window.removeEventListener('beforeunload', exitConfirmHandler)
    screenshotButton?.remove()
  },
  plugin: {
    displayName: '直播截图 - 快捷键支持',
    setup: ({ addData }) => {
      addData('keymap.actions', (actions: Record<string, KeyBindingAction>) => {
        actions.takeLiveScreenshot = {
          displayName: '直播截图',
          run: () => {
            // 插件在所有页面都会注册, 组件未在页面运行时不做任何事
            if (!enabled) {
              return undefined
            }
            return takeLiveScreenshot()
          },
        }
      })
      addData('keymap.presets', (presetBase: Record<string, string>) => {
        presetBase.takeLiveScreenshot = 'ctrl [shift] alt c'
      })
    },
  },
})
