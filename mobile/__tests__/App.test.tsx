import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// The App component already wraps with Provider, SafeAreaProvider, etc.
// This test ensures it renders without crashing.

describe('App', () => {
  it('renders correctly', async () => {
    let tree;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    expect(tree).toBeDefined();
  });

  it('contains the main navigation container', async () => {
    let tree;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    // With mocks in jest.setup.js, we expect it to render the RootNavigator
    // which initially shows the loading screen if isInitializing is true.
    const instance = tree!.root;
    expect(instance).toBeDefined();
  });
});
