import React from 'react'
import { View, Text, StyleSheet, Animated, Dimensions, LayoutAnimation, Vibration, PanResponder } from 'react-native'
import { GestureHandler,  } from 'expo'

const { PanGestureHandler, TapGestureHandler, LongPressGestureHandler, State } = GestureHandler

const { width: windowWidth } = Dimensions.get('window')

const HOLD_DURATION = 250

const RADIUS_BUBBLE = windowWidth / 5

const COLLAPSED_ARC_RADIUS = 1
const EXPANDED_ARC_RADIUS = 125

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
      }],
      radiusArc: COLLAPSED_ARC_RADIUS,
    }
  }

  _longPressRef = React.createRef()

  _getBubblePosition = (indice, origin, radiusArc) => {
    const {
      options,
    } = this.state
    
    const amountOfBubble = options.length
    const bubbleSpace = -65
    const angleRotation = 0

    const angleArc = (amountOfBubble - 1) * (2 * RADIUS_BUBBLE + bubbleSpace) / radiusArc
    const angleBubble = Math.PI / 2 + angleRotation + indice * angleArc / (amountOfBubble - 1) - (angleArc / 2)
    return {
      x: origin.x + Math.cos(angleBubble) * radiusArc,
      y: origin.y - Math.sin(angleBubble) * radiusArc,
    }
  }

  _expand = () => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.spring,
      duration: 250
    })
    this.setState({
      radiusArc: EXPANDED_ARC_RADIUS,
    })
  }


  _collapse = () => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 100
    })
    this.setState({
      radiusArc: COLLAPSED_ARC_RADIUS,
    })
  }


  render() {
    const {
      options,
      radiusArc,
    } = this.state

    const origin = {
      x: 150,
      y: 300,
    }

    return (
      <View>
        {options.map(({ label }, index) => {
          const position = radiusArc ? (
            this._getBubblePosition(index, origin, radiusArc) 
          ) : (
            origin
          )
          const { x: left, y: top } = position

          return (
            <View
              key={label}
              style={[
                styles.cheekyButton, {
                position: 'absolute',
                top,
                left,
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
        <LongPressGestureHandler
          ref={this._longPressRef}
          onActivated={this._expand}
        >
          <PanGestureHandler
            onEnded={this._collapse}
            simultaneousHandlers={[this._longPressRef]}
          >
              <View
                  style={[
                    styles.cheekyButton, {
                    position: 'absolute',
                    left: origin.x,
                    top: origin.y,
                  }]}
                >  
                  <Text
                    style={styles.buttonText}
                  >
                    {'Hold me'}
                  </Text>
                </View>
          </PanGestureHandler>
        </LongPressGestureHandler>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  cheekyButton: {
    backgroundColor: '#FF0000',
    aspectRatio: 1,
    width: RADIUS_BUBBLE,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: '#00FF00',
    aspectRatio: 1,
    width: RADIUS_BUBBLE,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  }
})

export default CheekyButton
