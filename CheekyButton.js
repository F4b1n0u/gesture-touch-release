import React from 'react'
import { View, Text, StyleSheet, Dimensions, LayoutAnimation, Animated } from 'react-native'
import { GestureHandler } from 'expo'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

const { PanGestureHandler, TapGestureHandler } = GestureHandler

const { width: windowWidth, height: windowHeight } = Dimensions.get('window')

const EXPANDED_ARC_RADIUS =  windowWidth / 3
const HIGHLIGTHED_ARC_RADIUS = EXPANDED_ARC_RADIUS * 1.1
const DEADZONE_ARC_RADIUS = EXPANDED_BUBBLE_RADIUS * 2
const EXPANDED_BUBBLE_RADIUS = windowWidth / 10
const COLLAPSED_BUBBLE_RADIUS = windowWidth / 10
const HIGHLIGTHED_BUBBLE_RADIUS = EXPANDED_BUBBLE_RADIUS
const BUBBLE_SPACING = windowWidth / 50

const ORIGIN = {
  top: windowHeight / 2,
  left: windowWidth / 2,
}

class CheekyButton extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      options: [{
        label: 'A',
      }, {
        label: 'B',
      }, {
        label: 'C',
      }, {
        label: 'D',
      }, {
        label: 'E',
      }, {
        label: 'F',
      }],
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

    console.log(highligthedBubbleIndex)

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

  _getAngleArc = () => {
    const {
      options: {
        length: amountOfBubble,
      },
    } = this.state

    return (amountOfBubble - 1) * 2 * (EXPANDED_BUBBLE_RADIUS + BUBBLE_SPACING) / EXPANDED_ARC_RADIUS
  }
  _getAngleArcRotation = (origin) => {
    return 0
  }

  _getBubbleDetails = (index, origin) => {
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
        top: origin.top - 2 * COLLAPSED_BUBBLE_RADIUS,
        left: origin.left - COLLAPSED_BUBBLE_RADIUS,
        width: COLLAPSED_BUBBLE_RADIUS * 2,
      }
    } else {
      const angleRotation = this._getAngleArcRotation()

      const angleArc = this._getAngleArc()
      const angleBubble = Math.PI / 2 + angleRotation + index * angleArc / (amountOfBubble - 1) - (angleArc / 2)
      const isHighligthedBubble = highligthedBubbleIndex == index
      
      const arcRadius = isHighligthedBubble ? highligthedArcRadius : EXPANDED_ARC_RADIUS
      const backgroundColor = isHighligthedBubble ? '#FF0000' : '#00FF00'
      const bubbleRadius = hasHighligthedBubble ? COLLAPSED_BUBBLE_RADIUS : HIGHLIGTHED_BUBBLE_RADIUS

      return {
        top: origin.top - 2 *bubbleRadius - Math.sin(angleBubble) * arcRadius,
        left: origin.left - bubbleRadius - Math.cos(angleBubble) * arcRadius,
        width: bubbleRadius * 2,
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
      hasHighligthedBubble
    } = this.state

    return (
      <Animated.View>
        {options.map(({ label }, index) => {
          const bubbleDetails = this._getBubbleDetails(index, ORIGIN) 
          
          return (
            <View
              key={label}
              style={[
                styles.floatingButton, {
                position: 'absolute',
                ...bubbleDetails,
              }]}
            >
              <Text
                style={styles.buttonText}
              >
                {label}
              </Text>
            </View>
          )})
        }
        <TapGestureHandler
          ref={this._longPressRef}
          // onActivated={this._expand}
        >
          <Animated.View>
            <PanGestureHandler
              onGestureEvent={this._onPanGestureEvent}
              onBegan={this._expand}
              onEnded={this._collapse}
              simultaneousHandlers={[this._longPressRef]}
            >
                <Animated.View
                    style={[
                      styles.cheekyButton, {
                      position: 'absolute',
                      top: ORIGIN.top - 2 * EXPANDED_BUBBLE_RADIUS,
                      left: ORIGIN.left - EXPANDED_BUBBLE_RADIUS,
                    }]}
                  >  
                    <Text
                      style={styles.buttonText}
                    >
                      {'Hold me'}
                    </Text>
                  </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  cheekyButton: {
    backgroundColor: '#FF0000',
    aspectRatio: 1,
    width: EXPANDED_BUBBLE_RADIUS * 2,
    borderRadius: HIGHLIGTHED_BUBBLE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    aspectRatio: 1,
    borderRadius: HIGHLIGTHED_BUBBLE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  }
})

export default CheekyButton
