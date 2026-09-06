import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Settings } from 'react-native-fbsdk-next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { COLORS } from './src/constants';

// Ignore specific logs if necessary
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'This method is deprecated', // Firebase v21 modular warning
  'Register token error', // Firebase Background 500
]);

function App() {
  useEffect(() => {
    try {
      Settings.initializeSDK();
      Settings.setAdvertiserTrackingEnabled(true);
    } catch (err) {
      console.error('Meta SDK Init Error:', err);
    }
  }, []);

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SafeAreaProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={COLORS.white}
              translucent
            />
            <RootNavigator />
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error('CRITICAL APP ERROR:', error);
    return null;
  }
}

export default App;
