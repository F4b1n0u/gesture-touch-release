import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { GestureHandler } from 'expo'
import Animated, { Easing } from 'react-native-reanimated'

const {
  abs,
  or,
  add,
  and,
  atan,
  block,
  Clock,
  cond,
  divide,
  eq,
  event,
  Extrapolate,
  interpolate,
  lessOrEq,
  lessThan,
  multiply,
  neq,
  set,
  sqrt,
  startClock,
  stopClock,
  timing,
  Value,
  modulo,
  greaterThan,
  sub,
} = Animated;

const { PanGestureHandler, LongPressGestureHandler, State } = GestureHandler

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const BUBBLE_RADIUS = WINDOW_WIDTH / 12
const BUBBLE_SPACING = WINDOW_WIDTH / 45
// TODO implement this !
const DEADZONE_ARC_RADIUS = BUBBLE_RADIUS
const EXPANDED_ARC_RADIUS = WINDOW_WIDTH / 4
const HIGHLIGTHED_ARC_RADIUS = 1.4
const HIGHLIGTHED_SCALE = 1.4


const LONG_PRESS_DURATION = 250
const LONG_PRESS_MAX_DIST = 20

const ORIGIN = {
  x: WINDOW_WIDTH / 2,
  y: WINDOW_HEIGHT / 2,
}

function runExpansion(longPressState) {
  const clock = new Clock()

  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  };

  const config = {
    toValue: new Value(0),
    duration: new Value(125),
    easing: Easing.inOut(Easing.ease),
  }

  return block([
    cond(and(eq(longPressState, State.ACTIVE), neq(config.toValue, 1)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 1),
      startClock(clock),
    ]),
    cond(and(eq(longPressState, State.END), neq(config.toValue, 0)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 0),
      startClock(clock),
    ]),
    timing(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position,
  ])
}

class CheekyButton extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      options: [
      {
        label: 'A',
      },
      {
        label: 'B',
      },
      {
        label: 'C',
      },
      {
        label: 'D',
      },
    ]}
  }

  _longPressRef = React.createRef()
  _touchRef = React.createRef()
  _touchX = new Value(0)
  _touchY = new Value(0)
  _onPanGestureEvent = event([{
    nativeEvent: {
      translationX: this._touchX,
      translationY: this._touchY,
    }
  }])
  _longPressState = new Value(State.UNDEFINED)
  _expansion = runExpansion(this._longPressState)
  _onLongPressStateChange = event([{
    nativeEvent: {
      state: this._longPressState,
    }
  }])
  
  render() {
    const {
      options,
    } = this.state

    return (
      <View>
        {options.map(({label, ...bubble}, position) => (
          <Bubble
            key={label}
            origin={ORIGIN}
            expansion={this._expansion}
            radius={BUBBLE_RADIUS}
            position={position}
            touch={{
              x: this._touchX,
              y: this._touchY,
            }}
            bubbleQuantity={options.length}
            {...bubble}
          >
            <Text
              style={styles.buttonText}
            >
              {label}
            </Text>
          </Bubble>
        ))}
        <LongPressGestureHandler
          ref={this._longPressRef}
          minDurationMs={LONG_PRESS_DURATION}
          maxDist={LONG_PRESS_MAX_DIST}
          onHandlerStateChange={this._onLongPressStateChange}
        >
          <Animated.View>
            <PanGestureHandler
              onGestureEvent={this._onPanGestureEvent}
              simultaneousHandlers={[this._longPressRef]}
            >
              <Animated.View>
                <Bubble
                  origin={ORIGIN}
                  radius={BUBBLE_RADIUS}
                  backgroundColor={'#AAAAAA'}
                >
                  <Text
                    style={styles.buttonText}
                  >
                    {'Hold me'}
                  </Text>
                </Bubble>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </LongPressGestureHandler>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  }
})

class Bubble extends React.Component {
  constructor(props) {
    super(props)

    const {
      touch: {
        x: touchX,
        y: touchY,
      }
    } = props

    const offsetAngle = this._getOffsetAngle()
    const cos = + Math.cos(offsetAngle)
    const sin = - Math.sin(offsetAngle)
    const expansionDistance = interpolate(
      props.expansion, {
      inputRange:  [0, 1],
      outputRange: [0, EXPANDED_ARC_RADIUS],
      easing: Easing.inOut(Easing.linear),
      extrapolate: Extrapolate.clamp,
    })
    const expandX = multiply(cos, expansionDistance)
    const expandY = multiply(sin, expansionDistance)
  
    const isExpanded = greaterThan(props.expansion, 0)
    const touchDistance = cond(isExpanded,
      sqrt(add(multiply(touchX, touchX), multiply(touchY, touchY))),
      // TODO check why it is not reseted to 0
      0
    )
    const highligtedTranslateRatio = interpolate(
      touchDistance, {
      inputRange:  [0, EXPANDED_ARC_RADIUS, 2 * EXPANDED_ARC_RADIUS],
      outputRange: [1, HIGHLIGTHED_ARC_RADIUS, 1],
      easing: Easing.inOut(Easing.linear),
      extrapolate: Extrapolate.clamp,
    })
    const highligtedScaleRatio = interpolate(
      touchDistance, {
      inputRange:  [0, EXPANDED_ARC_RADIUS, 2 * EXPANDED_ARC_RADIUS],
      outputRange: [1, HIGHLIGTHED_SCALE, 1],
      easing: Easing.inOut(Easing.linear),
      extrapolate: Extrapolate.clamp,
    })
   
    const angleOffset = new Value(0)
    const sides = new Value(0)
    const targetedAngle = block([
      cond(isExpanded, [
        cond(eq(multiply(touchX, touchY), 0),
          set(sides, 0),
          cond(lessThan(multiply(touchX, touchY), 0),
            set(sides, divide(touchY, touchX)),
            set(sides, divide(touchX, touchY)),
          )
        ),
        cond(lessOrEq(touchX, 0),
          cond(lessOrEq(touchY, 0),
            set(angleOffset, Math.PI / 2),
            set(angleOffset, Math.PI),
          ),
          cond(lessOrEq(touchY, 0),
            set(angleOffset, 0),
            set(angleOffset, 3 * Math.PI / 2),
          )
        ),
        add(atan(abs(sides)), angleOffset)
      ])
    ])
    
    //     from: + angle / 2,
    //     to: - angle / 2,
    //     angle: relativeAngle,
    
    //   var _from  = from  % (2 * Math.PI),
    //       _to    = to    % (2 * Math.PI),
    //       _angle = angle % (2 * Math.PI);
    const angle = this._getAngle()
    const minAngle = (+ angle / 2) % (2 * Math.PI)
    const maxAngle = (- angle / 2) % (2 * Math.PI)
    const from = new Value(maxAngle)
    const to = new Value(minAngle)
    const relativeAngle = modulo(sub(targetedAngle, offsetAngle), (2 * Math.PI))

    const isInRange = block([
      //   if (_from  < 0) _from  += (2 * Math.PI); // (-500) % (2 * Math.PI) === -140 :(
      //   if (_to    < 0) _to    += (2 * Math.PI);
      //   if (_angle < 0) _angle += (2 * Math.PI);
      cond(lessThan(from, 0),           set(from,           add(from, (2 * Math.PI)))),
      cond(lessThan(to, 0),             set(to,             add(to, (2 * Math.PI)))),
      cond(lessThan(relativeAngle, 0),  set(relativeAngle,  add(relativeAngle, (2 * Math.PI)))),
    
      //   if (_from === _to) {
      //     if (to > from)
      //       return true; // whole circle
      //     return _angle === _from; // exact only
      //   } else {
      //     if (_to < _from)
      //       return _angle <= _to || from <= _angle; // _angle outside range
      //     return _from <= _angle && _angle <= _to; 
      //   }

      cond(eq(from, to),
        [
          cond(greaterThan(to, from),
            true,
          ),
          eq(relativeAngle, from),
        ],
        cond(lessThan(to, from),
          or(
            lessOrEq(relativeAngle, to),
            lessOrEq(from, relativeAngle),
          )
          ,
          and(
            lessOrEq(from, relativeAngle),
            lessOrEq(relativeAngle, to),
          )
        ),
      ),
    ])

    //   if (isInRange({
    
    //   }) && isExpanded) { // not targeted
    //     if (isTargeted) {
    //       this.setState({
    //         isTargeted: false,
    //       })
    //     }
    //   } else { // targeted
    //     if (!isTargeted) {
    //       this.setState({
    //         isTargeted: true,
    //       })
    //     }
    //   }
    // }

    const isTargeted = cond(and(isExpanded, isInRange),
      cond(this.targetedState,
        false,
        true,
      ),
      false,
    )

    this._translateX = cond(isTargeted,
      multiply(expandX, highligtedTranslateRatio),
      expandX,
    )

    this._translateY = cond(isTargeted,
      multiply(expandY, highligtedTranslateRatio),
      expandY,
    )

    this._scale = cond(isTargeted,
      highligtedScaleRatio,
      1
    )
  }

  _getAngleRotation = () => {
    const {
      bubbleQuantity,
    } = this.props
    
    return Math.PI / 2 - (this._getAngle() * (bubbleQuantity - 1)) / 2
  }

  _getAngle = () => {
    const {
      radius,
    } = this.props
    
    return 2 * (radius + BUBBLE_SPACING) / EXPANDED_ARC_RADIUS
  }

  _getOffsetAngle = () => {
    const {
      position,
    } = this.props

    const angleRotation = this._getAngleRotation()
    const angle = this._getAngle()

    return angleRotation + position * angle
  }

  render() {
    const {
      children,
      radius,
      origin,
      backgroundColor: forcedBackgroundColor,
    } = this.props

    // TODO used animation to change the color
    if (forcedBackgroundColor) {
      backgroundColor = forcedBackgroundColor
    } else {
      backgroundColor = '#ff0000'
    }

    return (
      <View>
        <Animated.View
          style={[
            styles.bubble,
            {
              top: origin.y - radius,
              left: origin.x - radius,
              width: radius * 2,
              borderRadius: radius,
              backgroundColor: backgroundColor,
              transform: [{
                translateX: this._translateX,
                translateY: this._translateY,
                scale: this._scale,
              }],
            },
          ]}
        >  
          <Text
            style={styles.buttonText}
          >
            {children}
          </Text>
        </Animated.View>
      </View>
    )
  }
}

Bubble.defaultProps = {
  position: 0,
  bubbleQuantity: 0,
  expansion: new Value(0),
  touch: {
    x: new Value(0),
    y: new Value(0),
  }
}

export default CheekyButton
