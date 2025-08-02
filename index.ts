// Polyfill para structuredClone en React Native/iOS
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function structuredClone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Suprimir warning específico de React Native Paper + React 19
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Suprimir warning específico del prop compact en React.Fragment
  if (args[0]?.includes?.('Invalid prop `compact` supplied to `React.Fragment`')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
