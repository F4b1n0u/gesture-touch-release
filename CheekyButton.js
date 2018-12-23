import React from 'react'
import { View, Text, StyleSheet, Dimensions, Easing, Animated } from 'react-native'
import { GestureHandler } from 'expo'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

const { PanGestureHandler, LongPressGestureHandler, NativeViewGestureHandler } = GestureHandler

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const BUBBLE_RADIUS = WINDOW_WIDTH / 14
const BUBBLE_SPACING = WINDOW_WIDTH / 45
const EXPANDED_ARC_RADIUS =  WINDOW_WIDTH / 4

const SELECTED_ON_RATIO = 2
const SELECTED_OFF_RATIO = 3

const HIGHLIGTHED_BUBBLE_RADIUS_RATIO = 1.2

const ORIGIN = {
  x: WINDOW_WIDTH / 2,
  y: WINDOW_HEIGHT / 2,
}

// https://stackoverflow.com/questions/22658954/check-if-angle-is-between-angles-from-and-to-with-clockwise-direction
// thanks xD
function isInRange({ from, to, angle }) {
  var _from  = from  % (2 * Math.PI),
      _to    = to    % (2 * Math.PI),
      _angle = angle % (2 * Math.PI);
  if (_from  < 0) _from  += (2 * Math.PI); // (-500) % (2 * Math.PI) === -140 :(
  if (_to    < 0) _to    += (2 * Math.PI);
  if (_angle < 0) _angle += (2 * Math.PI);
  if (_from === _to) {
      if (to > from)
          return true; // whole circle
      return _angle === _from; // exact only
  }
  if (_to < _from)
      return _angle <= _to || from <= _angle; // _angle outside range
  return _from <= _angle && _angle <= _to;    // _angle inside range
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
      isSelected: false,
    }
  }

  _translatePosition = new Animated.ValueXY({ x: 0, y: 0 })
  _touchDistance = new Animated.Value(0)
  _highligtedTranslateRatio = this._touchDistance.interpolate({
    inputRange:  [0, EXPANDED_ARC_RADIUS,             2 * EXPANDED_ARC_RADIUS],
    outputRange: [1, HIGHLIGTHED_BUBBLE_RADIUS_RATIO, 1],
    easing: Easing.inOut(Easing.exp),
    extrapolate: 'clamp',
    useNativeDriver: true,
  })
  _highligtedTranslatePositionX = Animated.multiply(this._translatePosition.x, this._highligtedTranslateRatio)
  _highligtedTranslatePositionY = Animated.multiply(this._translatePosition.y, this._highligtedTranslateRatio)

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
    } = this.props

    const {
      isTargeted,
    } = this.state

    const touchAngle = this._getTouchAngle({ x, y })
    const angle = this._getAngle()
    const offsetAngle = this._getOffsetAngle()
    let relativeAngle = touchAngle - offsetAngle
    
    if (isInRange({
      from: angle / 2,
      to: - angle / 2,
      angle: relativeAngle,
    })) { // not targeted
      if (isExpanded && isTargeted) {
        this.setState({
          isTargeted: false,
        })
      }
    } else { // targeted
      if (isExpanded && !isTargeted) {
        this.setState({
          isTargeted: true,
        })
      }
    }
  }

  _handleHighlighted = ({ x, y }) => {
    const {
      isTargeted,
    } = this.state

    const distance = Math.sqrt(x * x + y * y)

    if (isTargeted) {
      Animated.timing(this._touchDistance, {
        toValue: distance,
        duration: 20,
        easing: Easing.inOut(Easing.linear)
      }).start()
    } else {
      Animated.timing(this._touchDistance, {
        toValue: 0,
        duration: 125,
      }).start()
    }
  }

  _handleSelected = ({ x, y }) => {
    const {
      isExpanded,
      origin,
    } = this.props

    const {
      isTargeted,
      isSelected,
    } = this.state

    if (isExpanded && isTargeted) {
      const position = {
        x: this._highligtedTranslatePositionX.__getValue(),
        y: this._highligtedTranslatePositionY.__getValue(),
      }
  
      const delta = {
        x: position.x - x,
        y: position.y - y,
      }
      const range = Math.sqrt(delta.x * delta.x + delta.y * delta.y)
  
      const isInSelectionRange = range < SELECTED_ON_RATIO * BUBBLE_RADIUS
      const isInDeselectionRange = range > SELECTED_OFF_RATIO * BUBBLE_RADIUS

      if (!isSelected && isInSelectionRange) {
        this.setState({
          isSelected: true
        })
      } else if (isInDeselectionRange) {
        this.setState({
          isSelected: false
        })
      }
    } else {
      this.setState({
        isSelected: false
      })
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
        }, () => {
          this._touchDistance.setValue(0)
        })
      })
    }
  }

  componentWillMount() {
    const {
      touch,
    } = this.props

    if (touch) {
      touch.addListener(this._handleTargeted)
      touch.addListener(this._handleHighlighted)
      touch.addListener(this._handleSelected)
    }
  }

  componentWillUnmount() {
    const {
      touch,
    } = this.props

    if (touch) {
      touch.removeListener(this._handleTargeted)
      touch.removeListener(this._handleHighlighted)
      touch.removeListener(this._handleSelected)
    }
  }

  render() {
    const {
      children,
      radius,
      origin,
      backgroundColor: forcedBackgroundColor,
    } = this.props

    const {
      isSelected,
    } = this.state

    // TODO used animation to change the color
    let backgroundColor
    if (forcedBackgroundColor) {
      backgroundColor = forcedBackgroundColor
    } else {
      backgroundColor = isSelected ? '#FF0000' : '#AAAAAA'
    }

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
            transform: [{
              translateX: this._highligtedTranslatePositionX,
            }, {
              translateY: this._highligtedTranslatePositionY,
            }, {
              scale: this._highligtedTranslateRatio,
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
    )
  }
}

export default CheekyButton
