(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.TinyScrollListener = factory());
}(this, (function () { 'use strict';

  var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var isFunction = function isFunction(value) {
    return typeof value === 'function';
  };
  var OUTSIDE = 'OUTSIDE';
  var INSIDE = 'INSIDE';
  var DIRECTION_DOWN = 1;
  var DIRECTION_UP = -1;
  var SCROLL_EVENT_NAME = 'scroll';
  var getEventDistance = function getEventDistance(event) {
    return isFunction(event.distance) ? event.distance() : event.distance;
  };

  /**
   * 默认使用 requestAnimationFrame 优化 scroll 监听
   */
  var defaultGetScrollHandler = function defaultGetScrollHandler(onScroll) {
    var rAFLock = false;
    var scrollHandler = function scrollHandler(e) {
      if (rAFLock) return;

      requestAnimationFrame(function () {
        onScroll(e);
        rAFLock = false;
      });
      rAFLock = true;
    };

    return scrollHandler;
  };

  var TinyScrollListener = function () {
    function TinyScrollListener(config) {
      var _this = this;

      _classCallCheck(this, TinyScrollListener);

      this.config = {};

      this.destroy = function () {
        return null;
      };

      this.dynamicEvents = [];
      this.staticEvents = [];

      this.walkEvent = function (event, scrollTop) {
        var _event$onGoingIn = event.onGoingIn,
            onGoingIn = _event$onGoingIn === undefined ? function () {
          return undefined;
        } : _event$onGoingIn,
            _event$onGoingOut = event.onGoingOut,
            onGoingOut = _event$onGoingOut === undefined ? function () {
          return undefined;
        } : _event$onGoingOut,
            status = event.status;

        var distance = getEventDistance(event);

        // 仅当状态值变更时触发 onGoingIn、onGoingOut 函数
        switch (status) {
          case INSIDE:
            if (scrollTop > distance) {
              onGoingOut();
              event.status = OUTSIDE;
            }
            break;
          case OUTSIDE:
            if (scrollTop <= distance) {
              onGoingIn();
              event.status = INSIDE;
            }
            break;
        }

        return event.status !== status;
      };

      this.walkStaticEvent = function (_ref) {
        var direction = _ref.direction,
            scrollTop = _ref.scrollTop;

        var current = _this.currentStaticEvent;
        var prev = current.prevEvent || current.getPrevEvent();
        var next = current.nextEvent || current.getNextEvent();
        var target = direction === DIRECTION_DOWN ? current : prev;

        if (target) {
          var changed = _this.walkEvent(target, scrollTop);

          // 若发生状态变迁
          if (changed) {
            _this.currentStaticEvent = (direction === DIRECTION_DOWN ? next : prev) || current;

            // 递归遍历下一个静态事件，保证单次大跨度滚动时可触发中间所有的静态事件
            _this.walkStaticEvent({ direction: direction, scrollTop: scrollTop });
          }
        }
      };

      this.walkDynamicEvents = function (_ref2) {
        var direction = _ref2.direction,
            scrollTop = _ref2.scrollTop;

        _this.dynamicEvents.sort(function (prev, next) {
          return (getEventDistance(prev) - getEventDistance(next)) * direction;
        }).forEach(function (event) {
          _this.walkEvent(event, scrollTop);
        });
      };

      this.config = config;
      this.init();
    }

    _createClass(TinyScrollListener, [{
      key: 'init',
      value: function init() {
        var _this2 = this;

        var _config = this.config,
            element = _config.element,
            _config$scrollHandler = _config.scrollHandler,
            getScrollHandler = _config$scrollHandler === undefined ? defaultGetScrollHandler : _config$scrollHandler,
            configGetScrollTop = _config.getScrollTop;

        // 若无滚动载体，报错并退出

        if (typeof element === 'undefined') {
          console.error('Need Scroll Container!');
          return;
        }

        var getScrollTop = isFunction(configGetScrollTop) ? configGetScrollTop : function () {
          return element.scrollTop;
        };

        this.getScrollTop = getScrollTop;

        // 初始化动态事件
        this.genDynamicEvents();
        // 初始化静态事件
        this.genStaticEvents();

        if (this.staticEvents.length === 0 && this.dynamicEvents.length === 0) {
          console.error('Need Events!');
          return;
        }

        var prevScrollTop = getScrollTop();
        var onScroll = function onScroll(e) {
          e.stopPropagation();

          var scrollTop = getScrollTop();
          var direction = scrollTop > prevScrollTop ? DIRECTION_DOWN : DIRECTION_UP;
          var walkParams = {
            scrollTop: scrollTop,
            direction: direction
          };

          _this2.walkStaticEvent(walkParams);
          _this2.walkDynamicEvents(walkParams);

          prevScrollTop = scrollTop;
        };

        var scrollHandler = getScrollHandler(onScroll);

        element.addEventListener(SCROLL_EVENT_NAME, scrollHandler);

        this.destroy = function () {
          return element.removeEventListener(SCROLL_EVENT_NAME, scrollHandler);
        };

        return this;
      }

      // 生成触底事件监听器

    }, {
      key: 'getEndReachedEvent',
      value: function getEndReachedEvent() {
        var _this3 = this;

        var _config2 = this.config,
            _config2$distanceToRe = _config2.distanceToReachEnd,
            distanceToReachEnd = _config2$distanceToRe === undefined ? 100 : _config2$distanceToRe,
            onEndReached = _config2.onEndReached,
            element = _config2.element;

        /**
         * 若使用触底函数，则启用相关逻辑
         */

        if (!isFunction(onEndReached)) {
          return;
        }

        // 触底函数是否被冻结，将此值置为 true 则停止使用触底函数
        var isEndReacherFreeze = false;

        /**
         * 每次触发 onEndReached 函数后会自动阻止下一次触发，需要执行 done 函数来释放阻止
         * （例如滚动到底部后开始做网络请求时，再次滚动到底部不会触发二次请求）
         * 如果 isOver 为 true 则不会再触发后续的 onEndReached
         * （例如已经加载了全部数据，不需要再监听触底事件）
         */
        var done = function done(isOver) {
          if (!isOver) {
            isEndReacherFreeze = false;
            return;
          } else {
            if (_this3.staticEvents.length === 0 && _this3.dynamicEvents.length === 1 && _this3.dynamicEvents[0] === endReachedEvent) {
              _this3.destroy();
            }
          }
        };

        var endReachedEvent = {
          dynamic: true,
          distance: function distance() {
            return element.scrollHeight - element.offsetHeight - distanceToReachEnd;
          },
          onGoingOut: function onGoingOut() {
            if (isEndReacherFreeze) return;
            isEndReacherFreeze = true;
            onEndReached(done);
          }
        };

        return endReachedEvent;
      }

      // 动态事件：distance 动态变化的事件，如触底事件需要根据容器高度决定触发条件，容器高度可能发生变化

    }, {
      key: 'genDynamicEvents',
      value: function genDynamicEvents() {
        var _config$distanceEvent = this.config.distanceEvents,
            configDistanceEvents = _config$distanceEvent === undefined ? [] : _config$distanceEvent;

        var endReachedEvent = this.getEndReachedEvent();
        var scrollTop = this.getScrollTop();

        var dynamicEvents = [].concat(_toConsumableArray(configDistanceEvents), [endReachedEvent]).filter(function (event) {
          return event && event.dynamic && isFunction(event.distance);
        }).map(function (event) {
          return _extends({}, event, {
            status: scrollTop > event.distance ? OUTSIDE : INSIDE // 初始化滚动事件节点状态
          });
        });
        this.dynamicEvents = dynamicEvents;
      }

      // 静态事件：distance 默认不变或只初始化一次后续不变化的事件

    }, {
      key: 'genStaticEvents',
      value: function genStaticEvents() {
        var _config$distanceEvent2 = this.config.distanceEvents,
            configDistanceEvents = _config$distanceEvent2 === undefined ? [] : _config$distanceEvent2;

        var scrollTop = this.getScrollTop();

        var staticEvents = configDistanceEvents.map(function (event) {
          return _extends({}, event, {
            distance: getEventDistance(event)
          });
        }).filter(function (event) {
          return event.distance >= 0 && !event.dynamic;
        }).map(function (event, idx) {
          var staticEvent = _extends({}, event, {
            status: scrollTop > event.distance ? OUTSIDE : INSIDE, // 初始化滚动事件节点状态
            // 使用链表结构优化静态事件的触发顺序
            prevEvent: undefined,
            nextEvent: undefined,
            getPrevEvent: function getPrevEvent() {
              var prevEvent = staticEvents[idx - 1] || null;
              staticEvent.prevEvent = prevEvent;

              return prevEvent;
            },
            getNextEvent: function getNextEvent() {
              var nextEvent = staticEvents[idx + 1] || null;
              staticEvent.nextEvent = nextEvent;

              return nextEvent;
            }
          });

          return staticEvent;
        });

        this.staticEvents = staticEvents;
        this.currentStaticEvent = staticEvents.find(function (event) {
          return event.distance >= scrollTop;
        });
      }
    }]);

    return TinyScrollListener;
  }();

  return TinyScrollListener;

})));
