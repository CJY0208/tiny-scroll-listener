(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.TinyScrollListener = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var isFunction = function isFunction(value) {
    return typeof value === 'function';
  };
  var OUTSIDE = 'OUTSIDE';
  var INSIDE = 'INSIDE';
  var SCROLL_EVENT_NAME = 'scroll';

  var TinyScrollListener = function TinyScrollListener(_ref) {
    var _this = this;

    var _ref$distanceToReachE = _ref.distanceToReachEnd,
        distanceToReachEnd = _ref$distanceToReachE === undefined ? 100 : _ref$distanceToReachE,
        onEndReached = _ref.onEndReached,
        element = _ref.element,
        _ref$distanceEvents = _ref.distanceEvents,
        distanceEvents = _ref$distanceEvents === undefined ? [] : _ref$distanceEvents;

    _classCallCheck(this, TinyScrollListener);

    // 若无滚动载体，报错并退出
    if (typeof element === 'undefined') {
      console.error('Need Scroll Container!');
      return;
    }

    // 判断滚动载体是否为 body
    var isBody = element === document.body;

    // 初始化滚动事件节点状态
    var distanceEventsStatus = distanceEvents.map(function (_ref2) {
      var distance = _ref2.distance;
      return element.scrollTop > distance ? OUTSIDE : INSIDE;
    });

    /**
     * 若使用触底函数，则启用相关逻辑
     */
    if (isFunction(onEndReached)) {
      // 触底函数是否被冻结，将此值置为 true 则停止使用触底函数
      var isEndReacherFreeze = false;

      /**
       * 每次触发 onEndReached 函数后会自动阻止下一次触发，需要执行 done 函数来释放阻止
       * （例如滚动到底部后开始做网络请求时，再次滚动到底部不会触发二次请求）
       * 如果 isOver 为 true 则不会再触发后续的 onEndReached
       * （例如已经加载了全部页，不需要再监听触底事件）
       */
      var done = function done(isOver) {
        if (!isOver) {
          isEndReacherFreeze = false;
          return;
        }

        if (distanceEvents.length === 1) {
          _this.destroy();
        }
      };

      var endReachedEvents = {
        distance: function distance() {
          return element.scrollHeight - element.offsetHeight - distanceToReachEnd;
        },

        onGoingOut: function onGoingOut() {
          if (isEndReacherFreeze) return;
          isEndReacherFreeze = true;
          onEndReached(done);
        }
      };

      distanceEvents.push(endReachedEvents);
      distanceEventsStatus.push(INSIDE);
    }

    // 若无滚动事件可用，报错并退出
    if (distanceEvents.length === 0) {
      console.error('Need Distance Events!');
      return;
    }

    var onScroll = function onScroll(e) {
      e.stopPropagation();

      // body 元素的 scrollTop 取值时不同于普通元素
      var scrollTop = isBody ? document.documentElement.scrollTop : element.scrollTop;

      // 每次 onScroll 触发时对各事件的监听
      distanceEvents.forEach(function (_ref3, idx) {
        var _ref3$distance = _ref3.distance,
            distance = _ref3$distance === undefined ? -1 : _ref3$distance,
            _ref3$onGoingIn = _ref3.onGoingIn,
            onGoingIn = _ref3$onGoingIn === undefined ? function () {
          return undefined;
        } : _ref3$onGoingIn,
            _ref3$onGoingOut = _ref3.onGoingOut,
            onGoingOut = _ref3$onGoingOut === undefined ? function () {
          return undefined;
        } : _ref3$onGoingOut;

        if (isFunction(distance)) {
          distance = distance();
        }

        // 仅当状态值变更时触发 onGoingIn、onGoingOut 函数
        switch (distanceEventsStatus[idx]) {
          case INSIDE:
            if (scrollTop > distance) {
              onGoingOut();
              distanceEventsStatus[idx] = OUTSIDE;
            }
            break;
          case OUTSIDE:
            if (scrollTop <= distance) {
              onGoingIn();
              distanceEventsStatus[idx] = INSIDE;
            }
            break;
        }
      });
    };

    /**
     * 使用 requestAnimationFrame 优化 scroll 监听
     */
    var rAFLock = false;
    var scrollHandler = function scrollHandler(e) {
      if (rAFLock) return;
      requestAnimationFrame(function () {
        onScroll.call(element, e);
        rAFLock = false;
      });
      rAFLock = true;
    }

    // .addEventListener('scroll', 在 body 上无效，需调用到 document 上
    ;(isBody ? document : element).addEventListener(SCROLL_EVENT_NAME, scrollHandler);

    this.destroy = function () {
      return (
        // .removeEventListener('scroll', 在 body 上无效，需调用到 document 上
        (isBody ? document : element).removeEventListener(SCROLL_EVENT_NAME, scrollHandler)
      );
    };

    return this;
  };

  return TinyScrollListener;

})));
