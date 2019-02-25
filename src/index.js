const isFunction = value => typeof value === 'function'
const OUTSIDE = 'OUTSIDE'
const INSIDE = 'INSIDE'
const SCROLL_EVENT_NAME = 'scroll'

export default class TinyScrollListener {
  constructor({
    distanceToReachEnd = 100,
    onEndReached,
    element,
    distanceEvents = []
  }) {
    // 若无滚动载体，报错并退出
    if (typeof element === 'undefined') {
      console.error('Need Scroll Container!')
      return
    }

    // 判断滚动载体是否为 body
    const isBody = element === document.body

    // 初始化滚动事件节点状态
    const distanceEventsStatus = distanceEvents.map(
      ({ distance }) => (element.scrollTop > distance ? OUTSIDE : INSIDE)
    )

    /**
     * 若使用触底函数，则启用相关逻辑
     */
    if (isFunction(onEndReached)) {
      // 触底函数是否被冻结，将此值置为 true 则停止使用触底函数
      let isEndReacherFreeze = false

      /**
       * 每次触发 onEndReached 函数后会自动阻止下一次触发，需要执行 done 函数来释放阻止
       * （例如滚动到底部后开始做网络请求时，再次滚动到底部不会触发二次请求）
       * 如果 isOver 为 true 则不会再触发后续的 onEndReached
       * （例如已经加载了全部页，不需要再监听触底事件）
       */
      const done = isOver => {
        if (!isOver) {
          isEndReacherFreeze = false
          return
        }

        if (distanceEvents.length === 1) {
          this.destroy()
        }
      }

      const endReachedEvents = {
        distance() {
          return (
            element.scrollHeight - element.offsetHeight - distanceToReachEnd
          )
        },
        onGoingOut: () => {
          if (isEndReacherFreeze) return
          isEndReacherFreeze = true
          onEndReached(done)
        }
      }

      distanceEvents.push(endReachedEvents)
      distanceEventsStatus.push(INSIDE)
    }

    // 若无滚动事件可用，报错并退出
    if (distanceEvents.length === 0) {
      console.error('Need Distance Events!')
      return
    }

    const onScroll = e => {
      e.stopPropagation()

      // body 元素的 scrollTop 取值时不同于普通元素
      const scrollTop = isBody
        ? document.documentElement.scrollTop
        : element.scrollTop

      // 每次 onScroll 触发时对各事件的监听
      distanceEvents.forEach(
        (
          {
            distance = -1,
            onGoingIn = () => undefined,
            onGoingOut = () => undefined
          },
          idx
        ) => {
          if (isFunction(distance)) {
            distance = distance()
          }

          // 仅当状态值变更时触发 onGoingIn、onGoingOut 函数
          switch (distanceEventsStatus[idx]) {
            case INSIDE:
              if (scrollTop > distance) {
                onGoingOut()
                distanceEventsStatus[idx] = OUTSIDE
              }
              break
            case OUTSIDE:
              if (scrollTop <= distance) {
                onGoingIn()
                distanceEventsStatus[idx] = INSIDE
              }
              break
          }
        }
      )
    }

    /**
     * 使用 requestAnimationFrame 优化 scroll 监听
     */
    let rAFLock = false
    const scrollHandler = e => {
      if (rAFLock) return
      requestAnimationFrame(() => {
        onScroll.call(element, e)
        rAFLock = false
      })
      rAFLock = true
    }

    // .addEventListener('scroll', 在 body 上无效，需调用到 document 上
    ;(isBody ? document : element).addEventListener(
      SCROLL_EVENT_NAME,
      scrollHandler
    )

    this.destroy = () =>
      // .removeEventListener('scroll', 在 body 上无效，需调用到 document 上
      (isBody ? document : element).removeEventListener(
        SCROLL_EVENT_NAME,
        scrollHandler
      )

    return this
  }
}
