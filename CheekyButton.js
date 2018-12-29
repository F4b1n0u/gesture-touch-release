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
const EXPANDED_ARC_RADIUS =  WINDOW_WIDTH / 4
const HIGHLIGTHED_BUBBLE_RADIUS_RATIO = 1.2
const LONG_PRESS_DURATION = 250

const ORIGIN = {
  x: WINDOW_WIDTH / 2,
  y: WINDOW_HEIGHT / 2,
}

function runExpansion(expansionState) {
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
    cond(and(eq(expansionState, State.ACTIVE), neq(config.toValue, 1)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 1),
      startClock(clock),
    ]),
    cond(and(eq(expansionState, State.END), neq(config.toValue, 0)), [
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

    this.state = {
      isTargeted: false,
      isSelected: false,
    }
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
  
    const touchDistance = sqrt(add(multiply(touchX, touchX), multiply(touchY, touchY)))
    const highligtedTranslateRatio = interpolate(
      touchDistance, {
      inputRange:  [0, EXPANDED_ARC_RADIUS,             2 * EXPANDED_ARC_RADIUS],
      outputRange: [1, HIGHLIGTHED_BUBBLE_RADIUS_RATIO, 1],
      easing: Easing.inOut(Easing.linear),
      extrapolate: 'clamp',
    })

    const expansionState = lessThan(props.expansion, 1)

    const angleOffset = new Value(0)
    const sides = new Value(0)
    const targetedAngle = block([
      cond(eq(props.expansion, 1), [
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
    
    const angle = this._getAngle()
    const minAngle = - angle / 2
    const maxAngle = + angle / 2
    const from = new Value(minAngle)
    const to = new Value(maxAngle)
    
    const relativeAngle = new Value(0)
    this._targetedState = cond(
      eq(props.expansion, 1),
        [
          set(relativeAngle, sub(targetedAngle, offsetAngle)),
          cond(
            eq(block([
              set(from, modulo(from, 2 * Math.PI)),
              set(to, modulo(to, 2 * Math.PI)),
              set(to, modulo(to, 2 * Math.PI)),
              cond(lessThan(from, 0),
                add(from, 2 * Math.PI),
              ),
              cond(lessThan(to, 0),
                add(to, 2 * Math.PI),
              ),
              cond(lessThan(relativeAngle, 0),
                add(relativeAngle, 2 * Math.PI),
              ),
              cond(eq(from, to),
                cond(greaterThan(to, from),
                  true,
                ),
                eq(relativeAngle, from),
              ),
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
            ]), true),
              cond(this.targetedState,
                false,
                true,
              ),
          )
        ],
        false,
    )

    this._translateX = cond(
      eq(this._targetedState, 1),
        multiply(expandX, highligtedTranslateRatio),
        expandX,
    )

    this._translateY = cond(
      eq(this._targetedState, 1),
        multiply(expandY, highligtedTranslateRatio),
        expandY,
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
