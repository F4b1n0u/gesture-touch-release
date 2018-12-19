import React from 'react'
import { View, Text, StyleSheet, Dimensions, LayoutAnimation } from 'react-native'
import { GestureHandler,  } from 'expo'

const { PanGestureHandler, LongPressGestureHandler } = GestureHandler

const { width: windowWidth, height: windowHeight } = Dimensions.get('window')

const RADIUS_BUBBLE = windowWidth / 10

const COLLAPSED_ARC_RADIUS = 1
const EXPANDED_ARC_RADIUS = 125

const ORIGIN = {
  x: windowWidth / 2 - RADIUS_BUBBLE,
  y: windowHeight / 2 - RADIUS_BUBBLE,
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
    const bubbleSpace = 20
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

    return (
      <View>
        {options.map(({ label }, index) => {
          const position = radiusArc ? (
            this._getBubblePosition(index, ORIGIN, radiusArc) 
          ) : (
            ORIGIN
          )
          const { x: right, y: top } = position

          return (
            <View
              key={label}
              style={[
                styles.cheekyButton, {
                position: 'absolute',
                top,
                right,
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
                    right: ORIGIN.x,
                    top: ORIGIN.y,
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
    width: RADIUS_BUBBLE * 2,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: '#00FF00',
    aspectRatio: 1,
    width: RADIUS_BUBBLE * 2,
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
