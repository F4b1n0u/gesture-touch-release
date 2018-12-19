import React from 'react'
import { StyleSheet, SafeAreaView, UIManager } from 'react-native'

import CheekyButton from './CheekyButton'

UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

const App = () => (
  <SafeAreaView
    style={styles.app}
  >
    <CheekyButton />
  </SafeAreaView>
)

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#000',
  },
})

export default App
