import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { GestureHandler } from 'expo'
import Animated, { Easing } from 'react-native-reanimated'

const {
  abs,
  add,
  and,
  atan,
  block,
  Clock,
  clockRunning,
  color,
  cond,
  divide,
  round,
  eq,
  event,
  greaterThan,
  debug,
  interpolate,
  lessOrEq,
  lessThan,
  modulo,
  multiply,
  neq,
  not,
  onChange,
  or,
  set,
  sqrt,
  startClock,
  stopClock,
  sub,
  timing,
  Value,
} = Animated

const { PanGestureHandler, LongPressGestureHandler, State } = GestureHandler

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const BUBBLE_RADIUS = WINDOW_WIDTH / 12
const BUBBLE_SPACING = WINDOW_WIDTH / 45
// TODO implement this !
const DEADZONE_ARC_RADIUS = BUBBLE_RADIUS
const EXPANDED_ARC_RADIUS = WINDOW_WIDTH / 4
const HIGHLIGTHED_ARC_RADIUS = 1.4
const HIGHLIGTHED_SCALE = 1.4

const SELECTION_RATIO = 1.8
const DESELECTION_RATIO = 2

const LONG_PRESS_DURATION = 250
const LONG_PRESS_MAX_DIST = 20

const ORIGIN = {
  x: WINDOW_WIDTH / 2,
  y: WINDOW_HEIGHT / 2,
}

function match(condsAndResPairs, offset = 0) {
  if (condsAndResPairs.length - offset === 1) {
    return condsAndResPairs[offset];
  } else if (condsAndResPairs.length - offset === 0) {
    return undefined;
  }
  return cond(
    condsAndResPairs[offset],
    condsAndResPairs[offset + 1],
    match(condsAndResPairs, offset + 2)
  );
}

function colorHSV(h /* 0 - 360 */, s /* 0 - 1 */, v /* 0 - 1 */) {
  // Converts color from HSV format into RGB
  // Formula explained here: https://www.rapidtables.com/convert/color/hsv-to-rgb.html
  const c = multiply(v, s);
  const hh = divide(h, 60);
  const x = multiply(c, sub(1, abs(sub(modulo(hh, 2), 1))));

  const m = sub(v, c);

  const colorRGB = (r, g, b) =>
    color(
      round(multiply(255, add(r, m))),
      round(multiply(255, add(g, m))),
      round(multiply(255, add(b, m)))
    );

  return match([
    lessThan(h, 60),
    colorRGB(c, x, 0),
    lessThan(h, 120),
    colorRGB(x, c, 0),
    lessThan(h, 180),
    colorRGB(0, c, x),
    lessThan(h, 240),
    colorRGB(0, x, c),
    lessThan(h, 300),
    colorRGB(x, 0, c),
    colorRGB(c, 0, x) /* else */,
  ]);
}

function runExpansion(longPressState) {
  const clock = new Clock()

  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  }

  const config = {
    toValue: new Value(0),
    duration: new Value(125),
    easing: Easing.in(Easing.elastic(1)),
  }

  return block([
    cond(and(eq(longPressState, State.ACTIVE), neq(config.toValue, 1)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 1),
      set(config.duration, new Value(300)),
      startClock(clock),
    ]),
    cond(and(eq(longPressState, State.END), neq(config.toValue, 0)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 0),
      set(config.duration, new Value(125)),
      startClock(clock),
    ]),
    timing(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position,
  ])
}

function runDistance(isTargeted, { x: touchX, y: touchY }) {
  const clock = new Clock()
  
  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  }


  // TODO need to check why there is this bug when you go behind and pass change isTarget
  const config = {
    toValue: new Value(0),
    duration: new Value(50),
    easing: Easing.inOut(Easing.ease),
  }

  const distance = cond(isTargeted,
    sqrt(add(multiply(touchX, touchX), multiply(touchY, touchY))),
    0
  )
  
  return block([
    onChange(isTargeted,
      cond(neq(config.toValue, distance), [
        set(state.finished, 0),
        set(state.time, 0),
        set(state.frameTime, 0),
        set(config.toValue, distance),
        startClock(clock),
      ]),
    ),

    timing(clock, state, config),
    cond(state.finished, stopClock(clock)),

    cond(clockRunning(clock),
      state.position,
      distance,
    )
  ])
}

function runBackgroundColor(isSelected) {
  const clock = new Clock()

  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  }

  const config = {
    toValue: new Value(0),
    duration: new Value(100),
    easing: Easing.in(Easing.ease),
  }

  return block([
    cond(and(isSelected, neq(config.toValue, .5)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, .5),
      startClock(clock),
    ]),
    cond(and(not(isSelected), neq(config.toValue, 0)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, 0),
      startClock(clock),
    ]),
    timing(clock, state, config),
    cond(state.finished, stopClock(clock)),

    colorHSV(.5, add(state.position, .5), .5, 1),
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
              x: block([
                // to avoid to keep the last position after released the finger
                cond(neq(this._longPressState, State.ACTIVE), set(this._touchX, 0)),
                this._touchX,
              ]),
              y: block([
                cond(neq(this._longPressState, State.ACTIVE), set(this._touchY, 0)),
                this._touchY,
              ]),
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
      touch,
      position,
    } = props
    
    const {
      x: touchX,
      y: touchY,
    } = touch

    const offsetAngle = this._getOffsetAngle()
    const cos = + Math.cos(offsetAngle)
    const sin = - Math.sin(offsetAngle)
    const expansionDistance = interpolate(
      props.expansion, {
      inputRange:  [0, 1],
      outputRange: [0, EXPANDED_ARC_RADIUS],
      extrapolateLeft: 'clamp',
    })
    const expandX = multiply(cos, expansionDistance)
    const expandY = multiply(sin, expansionDistance)
  
    const isExpanded = greaterThan(props.expansion, 0)
  
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
    
    const angle = this._getAngle()
    const minAngle = (+ angle / 2) % (2 * Math.PI)
    const maxAngle = (- angle / 2) % (2 * Math.PI)
    const from = new Value(maxAngle)
    const to = new Value(minAngle)
    const relativeAngle = modulo(sub(targetedAngle, offsetAngle), (2 * Math.PI))

    const isInRange = block([
      cond(lessThan(from, 0),           set(from,           add(from, (2 * Math.PI)))),
      cond(lessThan(to, 0),             set(to,             add(to, (2 * Math.PI)))),
      cond(lessThan(relativeAngle, 0),  set(relativeAngle,  add(relativeAngle, (2 * Math.PI)))),

      cond(eq(from, to),
        [
          cond(greaterThan(to, from),
            1,
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

    const isTargeted = and(isExpanded, isInRange)
    
    const touchDistance = runDistance(isTargeted, touch)

    const highligtedTranslateRatio = interpolate(
      touchDistance, {
      inputRange:  [0, EXPANDED_ARC_RADIUS, 2 * EXPANDED_ARC_RADIUS],
      outputRange: [1, HIGHLIGTHED_ARC_RADIUS, 1],
      extrapolateRight: 'clamp',
    })
    const highligtedScaleRatio = interpolate(
      touchDistance, {
      inputRange:  [0, EXPANDED_ARC_RADIUS, 2 * EXPANDED_ARC_RADIUS],
      outputRange: [1, HIGHLIGTHED_SCALE, 1],
      extrapolateRight: 'clamp',
    })

    this._translateX = multiply(expandX, highligtedTranslateRatio)

    this._translateY = multiply(expandY, highligtedTranslateRatio)

    this._scale = highligtedScaleRatio

    const deltaX = sub(expandX, touchX)
    const deltaY = sub(expandY, touchY)
    
    let range = sqrt(add(multiply(deltaX, deltaX), multiply(deltaY, deltaY)))
    let isInSelectionRange = and(isTargeted, lessThan(range, SELECTION_RATIO * BUBBLE_RADIUS))
    let isInDeselectionRange = and(isTargeted, greaterThan(range, DESELECTION_RATIO * BUBBLE_RADIUS))

    let isSelected = new Value(0)

    isSelected = block([
      cond(isTargeted, [
        onChange(isInDeselectionRange,
          cond(isInDeselectionRange, set(isSelected, 0))
        ),
        onChange(isInSelectionRange,
          cond(isInSelectionRange, set(isSelected, 1))
        ),
      ]),
      onChange(isTargeted,
        set(isSelected, and(isTargeted, isInSelectionRange))
      ),
      isSelected,
    ])

    this._backgroundColor = runBackgroundColor(isSelected)
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
      backgroundColor = this._backgroundColor
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
