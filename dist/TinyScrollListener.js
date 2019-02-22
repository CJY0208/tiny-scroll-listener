(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.TinyScrollListener = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var TinyScrollListener = function TinyScrollListener(_ref) {
    var _ref$distanceToReachE = _ref.distanceToReachEnd,
        distanceToReachEnd = _ref$distanceToReachE === undefined ? 100 : _ref$distanceToReachE,
        _ref$onEndReached = _ref.onEndReached,
        onEndReached = _ref$onEndReached === undefined ? function () {
      return undefined;
    } : _ref$onEndReached,
        element = _ref.element,
        _ref$distanceEvents = _ref.distanceEvents,
        distanceEvents = _ref$distanceEvents === undefined ? [] : _ref$distanceEvents;

    _classCallCheck(this, TinyScrollListener);

    this.endReacher = {
      working: true,
      pausing: false,
      pause: function pause() {
        this.pausing = true;
      },
      continue: function _continue() {
        this.pausing = false;
      }
    };

    var self = this;

    if (typeof element === 'undefined') throw Error('Need Scroll-Container!');

    var isBody = element === document.body;
    var rAFLock = false;
    var scrollHandler = void 0;
    var distanceEventsStatus = distanceEvents.map(function (_ref2) {
      var distance = _ref2.distance;
      return element.scrollTop > distance ? 'outside' : 'inside';
    });

    self.destroy = function () {
      if (isBody) {
        document.removeEventListener('scroll', scrollHandler);
      } else {
        element.removeEventListener('scroll', scrollHandler);
      }
    };

    function onScroll(e) {
      var _this = this;

      var scrollTop = isBody ? document.documentElement.scrollTop : this.scrollTop;

      e.stopPropagation();

      distanceEvents.forEach(function (_ref3, idx) {
        var _ref3$distance = _ref3.distance,
            distance = _ref3$distance === undefined ? -1 : _ref3$distance,
            _ref3$onGoingIn = _ref3.onGoingIn,
            onGoingIn = _ref3$onGoingIn === undefined ? function () {
          return console.log('on going in');
        } : _ref3$onGoingIn,
            _ref3$onGoingOut = _ref3.onGoingOut,
            onGoingOut = _ref3$onGoingOut === undefined ? function () {
          return console.log('on going out');
        } : _ref3$onGoingOut;

        switch (distanceEventsStatus[idx]) {
          case 'inside':
            if (scrollTop > distance) {
              onGoingOut.call(_this, self);
              distanceEventsStatus[idx] = 'outside';
            }
            break;
          case 'outside':
            if (scrollTop <= distance) {
              onGoingIn.call(_this, self);
              distanceEventsStatus[idx] = 'inside';
            }
            break;
        }
      });

      if (self.endReacher.working && !self.endReacher.pausing && this.scrollTop + this.offsetHeight + distanceToReachEnd > this.scrollHeight) {
        self.endReacher.pause();
        onEndReached.call(this, function done(isOver) {
          self.endReacher.continue();

          if (isOver) {
            if (distanceEvents.length === 0) {
              self.destroy();
            } else {
              self.endReacher.working = false;
            }
          }
        });
      }
    }

    scrollHandler = function scrollHandler(e) {
      if (rAFLock) return;
      requestAnimationFrame(function () {
        onScroll.call(element, e);
        rAFLock = false;
      });
      rAFLock = true;
    };

    // .addEventListener('scroll', 在 body 上无效
    if (isBody) {
      document.addEventListener('scroll', scrollHandler);
    } else {
      element.addEventListener('scroll', scrollHandler);
    }

    return self;
  };

  return TinyScrollListener;

})));
