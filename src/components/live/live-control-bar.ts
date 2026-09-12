import { childListSubtree } from '@/core/observer'
import { select } from '@/core/spin-query'
import { matchUrlPattern, raiseEvent } from '@/core/utils'
import { useScopedConsole } from '@/core/utils/log'
import { liveUrls } from '@/core/utils/urls'

const controllerSelector =
  '.bilibili-live-player-video-controller, .web-player-controller-wrap:not(.web-player-controller-bg)'
const controlBarMutationSelector =
  '.control-area, .web-player-controller-wrap, .bilibili-live-player-video-controller'

/**
 * 调出直播控制栏, 并执行回调. (调出后过一定时间会自动关闭)
 */
export const withControlBar = async (
  callback: (controlBar: HTMLElement) => void | Promise<void>,
) => {
  const livePlayer = (await select('.live-player-mounter')) as HTMLElement
  const console = useScopedConsole('withControlBar')
  if (!livePlayer) {
    console.warn('livePlayer not found')
    return
  }
  raiseEvent(livePlayer, 'mousemove')
  const controlBar = dq(livePlayer, '.web-player-controller-wrap .control-area') as HTMLElement
  if (!controlBar) {
    console.warn('controlBar not found')
    return
  }
  await callback(controlBar)
  raiseEvent(livePlayer, 'mouseleave')
}
/**
 * 当直播的控制栏显示时, 执行回调, 可用于插入一些额外元素
 * (鼠标进入/移出会创建/销毁控制栏的DOM, 所以想要额外元素常驻就得用这种方式)
 * 播放器重载会重建控制栏的DOM, 因此这里监听稳定存在的播放器挂载点, 每次相关变更时重新定位控制栏
 * - init: 只执行一次
 * - callback: 每次控制栏创建时执行
 */
export const waitForControlBar = async (config: {
  init?: (container: HTMLElement) => void
  callback?: (controlBar: HTMLElement) => void
}) => {
  if (!liveUrls.some(url => matchUrlPattern(url))) {
    return
  }
  const player = (await select('.live-player-mounter')) as HTMLElement
  if (!player) {
    return
  }

  const { init, callback } = config
  let initialized = false

  const handleControlBar = () => {
    const controllerContainer = dq(player, controllerSelector) as HTMLElement
    if (!controllerContainer) {
      return
    }
    if (!initialized) {
      initialized = true
      init?.(controllerContainer)
    }
    const controlBar = dq(controllerContainer, '.control-area') as HTMLElement
    if (controlBar) {
      callback?.(controlBar)
    }
  }

  childListSubtree(player, records => {
    const controlBarRelated =
      records.length === 0 ||
      records.some(record =>
        Array.from(record.addedNodes).some(
          node =>
            node instanceof HTMLElement &&
            (node.matches(controlBarMutationSelector) ||
              node.querySelector(controlBarMutationSelector) !== null),
        ),
      )
    if (controlBarRelated) {
      handleControlBar()
    }
  })
}
