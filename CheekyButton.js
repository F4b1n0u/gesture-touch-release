import React from 'react'
import RN from 'react-native'
import { GestureHandler } from 'expo'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import Color from 'color'
import Animated, { Easing } from 'react-native-reanimated'

const { View, Text, StyleSheet, Dimensions } = RN
const {
  Clock,
  cond,
  eq,
  event,
  interpolate,
  multiply,
  set,
  startClock,
  stopClock,
  timing,
  Value,
  block,
  and,
  neq,
  Extrapolate,
} = Animated;

const { PanGestureHandler, LongPressGestureHandler, NativeViewGestureHandler, State } = GestureHandler

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const BUBBLE_RADIUS = WINDOW_WIDTH / 12
const BUBBLE_SPACING = WINDOW_WIDTH / 45
const EXPANDED_ARC_RADIUS =  WINDOW_WIDTH / 4

const ORIGIN = {
  x: WINDOW_WIDTH / 2,
  y: WINDOW_HEIGHT / 2,
}

function runExpansion(clock, expansionState) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  };

  const config = {
    toValue: new Value(0),
    duration: new Value(0),
    easing: Easing.inOut(Easing.ease),
  }

  return block([
    cond(and(eq(expansionState, State.ACTIVE), neq(config.toValue, 1)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.duration, 250),
      set(config.toValue, 1),
      startClock(clock),
    ]),
    cond(and(eq(expansionState, State.END), neq(config.toValue, 0)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.duration, 125),
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
      // {
      //   label: 'B',
      // },
      // {
      //   label: 'C',
      // },
      // {
      //   label: 'D',
      // },
      // {
      //   label: 'E',
      // },
      // {
      //   label: 'F',
      // },
      // {
      //   label: 'G',
      // },
      // {
      //   label: 'H',
      // }
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
  _expansionClock = new Clock()
  _expansionState = new Value(-1)
  _expansion = runExpansion(this._expansionClock, this._expansionState)
  _onLongPressStateChange = event([{
    nativeEvent: {
      state: this._expansionState,
    }
  }], {
    useNativeDriver: true,
  })
  
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

    const offsetAngle = this._getOffsetAngle()
    const cos = + Math.cos(offsetAngle)
    const sin = - Math.sin(offsetAngle)
    const distance = interpolate(
      props.expansion, {
      inputRange:  [0, 1],
      outputRange: [0, EXPANDED_ARC_RADIUS],
      easing: Easing.inOut(Easing.linear),
      extrapolate: Extrapolate.clamp,
    })
    this._translatePositionX = multiply(cos, distance)
    this._translatePositionY = multiply(sin, distance)
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
                translateX: this._translatePositionX && this._translatePositionX,
              }, {
                translateY: this._translatePositionY && this._translatePositionY,
              }]
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
}

export default CheekyButton
