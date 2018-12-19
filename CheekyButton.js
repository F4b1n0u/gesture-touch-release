import React from 'react'
import { View, Text, StyleSheet, Dimensions, LayoutAnimation } from 'react-native'
import { GestureHandler,  } from 'expo'

const { PanGestureHandler, LongPressGestureHandler } = GestureHandler

const { width: windowWidth, height: windowHeight } = Dimensions.get('window')

const EXPANDED_ARC_RADIUS = 125
const COLLAPSED_BUBBLE_RADIUS = windowWidth / 10
const EXPANDED_BUBBLE_RADIUS = windowWidth / 10

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
      }],
      isExpanded: false,
    }
  }

  _longPressRef = React.createRef()

  _getBubbleDetails = (indice, origin) => {
    const {
      options,
      isExpanded,
    } = this.state
    
    if (!isExpanded) {
      return {
        top: origin.top - 2 * COLLAPSED_BUBBLE_RADIUS,
        left: origin.left - COLLAPSED_BUBBLE_RADIUS,
        width: COLLAPSED_BUBBLE_RADIUS * 2,
      }
    } else {
      const amountOfBubble = options.length
      const bubbleSpace = 20
      const angleRotation = 0

      const angleArc = (amountOfBubble - 1) * (2 * EXPANDED_BUBBLE_RADIUS + bubbleSpace) / EXPANDED_ARC_RADIUS
      const angleBubble = Math.PI / 2 + angleRotation + indice * angleArc / (amountOfBubble - 1) - (angleArc / 2)
      return {
        top: origin.top - 2 * COLLAPSED_BUBBLE_RADIUS - Math.sin(angleBubble) * EXPANDED_ARC_RADIUS,
        left: origin.left - COLLAPSED_BUBBLE_RADIUS - Math.cos(angleBubble) * EXPANDED_ARC_RADIUS,
        width: EXPANDED_BUBBLE_RADIUS * 2,
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


  render() {
    const {
      options,
    } = this.state

    return (
      <View>
        {options.map(({ label }, index) => {
          const bubbleDetails = this._getBubbleDetails(index, ORIGIN) 
          
          return (
            <View
              key={label}
              style={[
                styles.floatingButton, {
                position: 'absolute',
                ...bubbleDetails
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
                    top: ORIGIN.top - 2 * EXPANDED_BUBBLE_RADIUS,
                    left: ORIGIN.left - EXPANDED_BUBBLE_RADIUS,
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
    backgroundColor: '#FF000050',
    aspectRatio: 1,
    width: EXPANDED_BUBBLE_RADIUS * 2,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: '#00FF00',
    aspectRatio: 1,
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
