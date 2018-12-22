import React from 'react'
import { View, Text, StyleSheet, Dimensions, LayoutAnimation, Animated } from 'react-native'
import { GestureHandler } from 'expo'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

const { PanGestureHandler, LongPressGestureHandler, NativeViewGestureHandler } = GestureHandler

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const BUBBLE_RADIUS = WINDOW_WIDTH / 10
const BUBBLE_SPACING = WINDOW_WIDTH / 35
const EXPANDED_ARC_RADIUS =  WINDOW_WIDTH / 3

const HIGHLIGTHED_ON_RATIO = .2
const HIGHLIGTHED_OFF_RATIO = .4
const HIGHLIGTHED_BUBBLE_RADIUS_RATIO = 1.2

const ORIGIN = {
  x: WINDOW_WIDTH / 2,
  y: WINDOW_HEIGHT / 2,
}

class CheekyButton extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      options: [{
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
      {
        label: 'E',
      },
      {
        label: 'F',
      },
      {
        label: 'G',
      },
      {
        label: 'H',
      }
    ],
      isExpanded: false,
    }
  }

  _longPressRef = React.createRef()
  _touchRef = React.createRef()
  _touchXY = new Animated.ValueXY()
  _onPanGestureEvent = Animated.event([{
    nativeEvent: {
      translationX: this._touchXY.x,
      translationY: this._touchXY.y,
    }
  }], {
    useNativeDriver: true
  })

  _expand = () => {
    this.setState({
      isExpanded: true,
    }, () => {
      ReactNativeHapticFeedback.trigger('impactHeavy')
    })
  }

  _collapse = () => {
    this.setState({
      isExpanded: false,
    })
  }

  render() {
    const {
      options,
      isExpanded,
    } = this.state

    return (
      <View>
        {options.map(({label, ...bubble}, position) => (
          <Bubble
            key={label}
            origin={ORIGIN}
            isExpanded={isExpanded}
            radius={BUBBLE_RADIUS}
            position={position}
            touch={this._touchXY}
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
          onActivated={this._expand}
        >
          <View>
            <NativeViewGestureHandler>
              <View>
                <PanGestureHandler
                  onGestureEvent={this._onPanGestureEvent}
                  isExpanded={false}
                  // onActivated={this._expand}
                  onEnded={this._collapse}
                  simultaneousHandlers={[this._longPressRef]}
                >
                  <Animated.View>
                    <Bubble
                      origin={ORIGIN}
                      radius={BUBBLE_RADIUS}
                      backgroundColor={'#aaaaaa'}
                    >
                      <Text
                        style={styles.buttonText}
                      >
                        {'Hold me'}
                      </Text>
                    </Bubble>
                  </Animated.View>
                </PanGestureHandler>
              </View>
            </NativeViewGestureHandler>
          </View>
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
      isHighligthed: false,
    }
  }

  _translatePosition = new Animated.ValueXY({ x: 0, y: 0 })

  _getAngleRotation = () => {
    const {
      bubbleQuantity,
    } = this.props

    return Math.PI / 2 - (this._getAngle() * (bubbleQuantity - 1)) / 2
  }

  _getExpandedDistance = () => {
    // TODO need to depend of the position of the finger
    return EXPANDED_ARC_RADIUS
  }

  _getAngle = () => {
    const {
      radius,
    } = this.props

    const expandedDistance = this._getExpandedDistance()
    
    return 2 * (radius + BUBBLE_SPACING) / expandedDistance
  }

  _getOffsetAngle = () => {
    const {
      radius,
      position,
    } = this.props

    const angleRotation = this._getAngleRotation()
    const angle = this._getAngle()

    return angleRotation + position * angle
  }

  _handlePosition = (onExpanded = () => {}, onCollapsed = () => {}) => {
    const {
      isExpanded,
    } = this.props

    if (!isExpanded) {
      const expandedDistance = this._getExpandedDistance()
      const offsetAngle = this._getOffsetAngle()

      // duration shoudl depend on how far we already 
      Animated.parallel([
        Animated.timing(this._translatePosition.x, {
          toValue: + Math.cos(offsetAngle) * expandedDistance,
          duration: 125,
        }),
        Animated.timing(this._translatePosition.y, {
          toValue: - Math.sin(offsetAngle) * expandedDistance,
          duration: 125,
        })
      ]).start(onExpanded)      
    } else {
      Animated.parallel([
        Animated.timing(this._translatePosition.x, {
          toValue: 0,
          duration: 90,
        }),
        Animated.timing(this._translatePosition.y, {
          toValue: 0,
          duration: 90,
        })
      ]).start(onCollapsed)   
    }
  }

  _handleHighlighted = ({ x, y }) => {
    const {
      isExpanded,
    } = this.state

    const distance = Math.sqrt(x * x + y * y)
    
    if (isExpanded) {
      
    }
  }

  _getTouchAngle = ({ x, y }) => {
    let angleOffset
    let sides = (y * x) < 0 ? (
      sides = y / x
    ) : (
      sides = x / y
    )
    if (x < 0) { { // x-
      if (y < 0) { // y-
        angleOffset =  Math.PI / 2
      } else       // y+
        angleOffset =  Math.PI
      }
    } else {       // x+
      if (y < 0) { // y-
        angleOffset = 0
      } else {     // y-
        angleOffset = 3 * Math.PI / 2
      }
    }

    return Math.atan(Math.abs(sides)) + angleOffset
  }

  _handleTargeted = ({ x, y }) => {
    const {
      isExpanded,
      position,
    } = this.props

    const {
      isTargeted,
    } = this.state

    const touchAngle = this._getTouchAngle({ x, y })
    const angle = this._getAngle()
    const offsetAngle = this._getOffsetAngle()
    const relativeAngle = touchAngle - offsetAngle

    if (position === 0) {
      console.log(offsetAngle, angle, relativeAngle)
    }

    if (
      relativeAngle > - angle / 2
      &&
      relativeAngle < + angle / 2
    ) {
      if (isExpanded && !isTargeted) {
        this.setState({
          isTargeted: true,
        })
      }
    } else {
      if (isExpanded && isTargeted) {
        this.setState({
          isTargeted: false,
        })
      }
    }
  }

  componentWillUpdate({ isExpanded: wasExpanded }) {
    const {
      isExpanded,
    } = this.props

    const needPositionAnimation = wasExpanded !== isExpanded
    
    if (needPositionAnimation) {
      this._handlePosition(null, () => {
        this.setState({
          isTargeted: false
        })
      })
    }
  }

  componentWillMount() {
    const {
      touch,
    } = this.props

    if (touch) {
      touch.addListener(this._handleHighlighted)
      touch.addListener(this._handleTargeted)
    }
  }

  componentWillUnmount() {
    const {
      touch,
    } = this.props

    if (touch) {
      touch.removeListener(this._handleHighlighted)
      touch.removeListener(this._handleTargeted)
    }
  }

  render() {
    const {
      children,
      radius,
      origin,
    } = this.props

    const {
      isTargeted,
    } = this.state

    // TODO used animation to change the color
    const backgroundColor = isTargeted ? '#770000' : '#00ff00'

    return (
      <Animated.View
        style={[
          styles.bubble,
          {
            top: origin.y - radius,
            left: origin.x - radius,
            width: radius * 2,
            borderRadius: radius,
            backgroundColor,
            transform: this._translatePosition.getTranslateTransform(),
          },
        ]}
      >  
        <Text
          style={styles.buttonText}
        >
          {children}
        </Text>
      </Animated.View>
    )
  }
}

export default CheekyButton
