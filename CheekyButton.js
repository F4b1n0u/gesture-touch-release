import React from 'react'
import { View, Text, StyleSheet, Animated, Dimensions, LayoutAnimation } from 'react-native'
import { GestureHandler } from 'expo'

const { PanGestureHandler, TapGestureHandler, LongPressGestureHandler, State } = GestureHandler

const { width: windowWidth } = Dimensions.get('window')

const HOLD_DURATION = 250

const RADIUS_BUBBLE = windowWidth / 5

const COLLAPSED_ARC_RADIUS = 1
const EXPANDED_ARC_RADIUS = 125
console.log(State)
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

    this._translateX = new Animated.Value(0)
    this._translateY = new Animated.Value(0)

    this._onLongPress = ({ nativeEvent }) => {
      if (nativeEvent.state === State.ACTIVE) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
        this.setState({
          radiusArc: EXPANDED_ARC_RADIUS,
        })
        // console.log('I\'m being pressed for so long')
      }
    }

    this._onSingleTap = ({ nativeEvent }) => {
      if (nativeEvent.state === State.ACTIVE) {
        // console.log('I\'m being tapped')
      }
    }

    this._onPanEvent = ({ nativeEvent }) => {
      console.log('_onPanEvent', nativeEvent.state)
      switch (nativeEvent.state) {
        case State.ACTIVE:
          // console.log('I\'m being dragged')
          break
        default:
          break
      }
    }

    this._onDrag = ({ nativeEvent }) => {
      console.log('_onDrag', nativeEvent.state)
      switch (nativeEvent.state) {
        case State.END:
          LayoutAnimation.configureNext({
            ...LayoutAnimation.Presets.easeInEaseOut,
            duration: 100
          })
          this.setState({
            radiusArc: COLLAPSED_ARC_RADIUS,
          })
        default:
          break
      }
    }
  }

  _dragRef = React.createRef()
  _longPressRef = React.createRef()
    _tapRef = React.createRef()

  componentWillMount() {
    this._translateX.addListener(this._handleDrag)
    this._translateY.addListener(this._handleDrag)
  }

  componentWillUnmount() {
    this._translateX.removeListener(this._handleDrag)
    this._translateY.removeListener(this._handleDrag)
  }

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
        <PanGestureHandler
          ref={this._dragRef}
          onGestureEvent={this._onPanEvent}
          onHandlerStateChange={this._onDrag}
          simultaneousHandlers={[this._longPressRef, this._tapRef]}
          
        >
        <LongPressGestureHandler
          ref={this._longPressRef}
          onHandlerStateChange={this._onLongPress}
          minDurationMs={HOLD_DURATION}
          simultaneousHandlers={[this._dragRef, this._tapRef]}
        >
          <TapGestureHandler
            ref={this._tapRef}
            onHandlerStateChange={this._onSingleTap}
            simultaneousHandlers={[this._dragRef]}
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
          </TapGestureHandler>
        </LongPressGestureHandler>
            </PanGestureHandler>

        
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
