import React from 'react'
import { View, Text, StyleSheet, Dimensions, LayoutAnimation, Animated } from 'react-native'
import { GestureHandler } from 'expo'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

const { PanGestureHandler, TapGestureHandler } = GestureHandler

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const EXPANDED_ARC_RADIUS =  WINDOW_WIDTH / 3
const HIGHLIGTHED_ARC_RADIUS = EXPANDED_ARC_RADIUS * 1.1
const DEADZONE_ARC_RADIUS = EXPANDED_BUBBLE_RADIUS * 2

const EXPANDED_BUBBLE_RADIUS = WINDOW_WIDTH / 10
const COLLAPSED_BUBBLE_RADIUS = WINDOW_WIDTH / 10
const HIGHLIGTHED_BUBBLE_RADIUS = EXPANDED_BUBBLE_RADIUS
const BUBBLE_SPACING = 20

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
      }
    ],
      isExpanded: false,
      hasHighligthedBubble: false,
      highligthedBubbleIndex: null,
      highligthedArcRadius: EXPANDED_ARC_RADIUS
    }
  }

  _longPressRef = React.createRef()
  _touchXY = new Animated.ValueXY()
  _touchedExpandedArcAngle = new Animated.Value()
  _touchedExpandedArcRadius = new Animated.Value()
  _onPanGestureEvent = Animated.event([{
    nativeEvent: {
      translationX: this._touchXY.x,
      translationY: this._touchXY.y,
    }
  }], {
    useNativeDriver: true
  })

  _handleTouchXY = ({ x, y }) => {
    const {
      isExpanded,
    } = this.state

    const distance = Math.sqrt(x * x + y * y)
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

    const angle = Math.atan(Math.abs(sides)) + angleOffset

    if (isExpanded) {
      this._touchedExpandedArcRadius.setValue(distance)
      this._touchedExpandedArcAngle.setValue(angle)
    }
  }

  _handleExpandedArcRadius = ({ value }) => {
    if (value > DEADZONE_ARC_RADIUS) {
      this.setState({
        hasHighligthedBubble: true
      })
    } else {
      this.setState({
        hasHighligthedBubble: false,
      })
    }
  }

  _handleExpandedArcAngle = ({ value }) => {
    const {
      options,
      hasHighligthedBubble,
      highligthedBubbleIndex: currentlyHighligthedBubbleIndex,
    } = this.state

    const angleRotation = this._getAngleArcRotation()

    const angleArc = this._getAngleArc()
    const anglePerBubble = angleArc / options.length

    const highligthedBubbleIndex = (Math.PI - value / anglePerBubble).toFixed(0)

    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 250
    })

    if (hasHighligthedBubble) {
      if (currentlyHighligthedBubbleIndex != highligthedBubbleIndex) {
        ReactNativeHapticFeedback.trigger('impactMedium')
      }

      this.setState({
        highligthedArcRadius: HIGHLIGTHED_ARC_RADIUS,
        highligthedBubbleIndex,
      })
    } else {
      this.setState({
        highligthedArcRadius: EXPANDED_ARC_RADIUS,
        highligthedBubbleIndex: null,
      })
    }
  }

  _getBubblesAngleArc = () => {
    const {
      options: {
        length: amountOfBubble,
      },
    } = this.state
    // it's an appromative calculs but close enough to the real deal
    return amountOfBubble * 2 * (EXPANDED_BUBBLE_RADIUS) / EXPANDED_ARC_RADIUS
  }

  _getSpacingAngleArc = () => {
    const {
      options: {
        length: amountOfBubble,
      },
    } = this.state
    // it's an appromative calculs but close enough to the real deal
    return amountOfBubble * 2 * (BUBBLE_SPACING) / EXPANDED_ARC_RADIUS
  }

  _getAngleArc = () => {
    return this._getSpacingAngleArc() + this._getBubblesAngleArc()
  }

  _getAngleArcRotation = (center) => {
    return 0
  }

  _getBubbleDetails = (index, center) => {
    const {
      options: {
        length: amountOfBubble,
      },
      isExpanded,
      hasHighligthedBubble,
      highligthedBubbleIndex,
      highligthedArcRadius,
    } = this.state
    
    if (!isExpanded) {
      return {
        center,
        radius: COLLAPSED_BUBBLE_RADIUS,
        backgroundColor: 'FF0000',
      }
    } else {
      const angleRotation = this._getAngleArcRotation()

      const angleArc = this._getAngleArc()

      const relativeAngleBubble = index * angleArc / amountOfBubble
      const absoluteAngleBubble = relativeAngleBubble + angleRotation
      const isHighligthedBubble = highligthedBubbleIndex == index
      
      const arcRadius = isHighligthedBubble ? highligthedArcRadius : EXPANDED_ARC_RADIUS
      const backgroundColor = isHighligthedBubble ? '#FF0000' : '#00FF00'
      const bubbleRadius = hasHighligthedBubble ? COLLAPSED_BUBBLE_RADIUS : HIGHLIGTHED_BUBBLE_RADIUS

      return {
        center: {
          x: center.x - Math.sin(absoluteAngleBubble) * arcRadius,
          y: center.y - Math.cos(absoluteAngleBubble) * arcRadius,
        },
        radius: bubbleRadius,
        backgroundColor,
      }
    }
  }

  _expand = () => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 250
    })
    this.setState({
      isExpanded: true,
    }, () => {
      ReactNativeHapticFeedback.trigger('impactHeavy')
    })
  }

  _collapse = () => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 100
    })
    this.setState({
      isExpanded: false,
    })
  }

  componentWillMount() {
    this._touchXY.addListener(this._handleTouchXY)
    this._touchedExpandedArcRadius.addListener(this._handleExpandedArcRadius)
    this._touchedExpandedArcAngle.addListener(this._handleExpandedArcAngle)
  }

  componentWillUnmount() {
    this._touchXY.removeListener(this._handleTouchXY)
    this._touchedExpandedArcRadius.removeListener(this._handleExpandedArcRadius)
    this._touchedExpandedArcAngle.removeListener(this._handleExpandedArcAngle)
  }

  render() {
    const {
      options,
    } = this.state

    return (
      <View>
        {options.map(({ label }, index) => {
          const bubbleDetails = this._getBubbleDetails(index, ORIGIN) 

          return (
            <Bubble
              key={label}
              {...bubbleDetails}
            >
              <Text
                style={styles.buttonText}
              >
                {label}
              </Text>
            </Bubble>
          )})
        }
        <TapGestureHandler
          ref={this._longPressRef}
          // onActivated={this._expand}
        >
          <View>
            <PanGestureHandler
              onGestureEvent={this._onPanGestureEvent}
              onBegan={this._expand}
              onEnded={this._collapse}
              simultaneousHandlers={[this._longPressRef]}
            >
              <Animated.View>
                <Bubble
                  center={ORIGIN}
                  radius={COLLAPSED_BUBBLE_RADIUS}
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
        </TapGestureHandler>
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
  render() {
    const {
      children,
      center,
      radius,
      backgroundColor,
    } = this.props

    return (
      <View
        style={[
          styles.bubble,
          {
            top: center.y - radius,
            left: center.x - radius,
            width: radius * 2,
            borderRadius: radius,
            backgroundColor,
          },
        ]}
      >  
        <Text
          style={styles.buttonText}
        >
          {children}
        </Text>
      </View>
    )
  }
}


export default CheekyButton
