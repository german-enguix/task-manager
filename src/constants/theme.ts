import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

type MD3Colors = typeof MD3LightTheme.colors;

// Paleta de colores basada en Material Theme Builder (light/dark)
// Fuente provista por el usuario (esquema MD3)
const brandLightColors = {
  primary: '#136682',
  onPrimary: '#ffffff',
  primaryContainer: '#bee9ff',
  onPrimaryContainer: '#004d65',
  secondary: '#4d616c',
  onSecondary: '#ffffff',
  secondaryContainer: '#d0e6f2',
  onSecondaryContainer: '#354a54',
  tertiary: '#5d5b7d',
  onTertiary: '#ffffff',
  tertiaryContainer: '#e3dfff',
  onTertiaryContainer: '#464364',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  background: '#f6fafe',
  onBackground: '#171c1f',
  surface: '#f6fafe',
  onSurface: '#171c1f',
  surfaceVariant: '#dce4e9',
  onSurfaceVariant: '#40484c',
  outline: '#70787d',
  outlineVariant: '#c0c8cd',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2c3134',
  inverseOnSurface: '#edf1f5',
  inversePrimary: '#8ccff0',
} satisfies Partial<MD3Colors>;

const brandDarkColors = {
  primary: '#8ccff0',
  onPrimary: '#003546',
  primaryContainer: '#004d65',
  onPrimaryContainer: '#bee9ff',
  secondary: '#b4cad6',
  onSecondary: '#1f333d',
  secondaryContainer: '#354a54',
  onSecondaryContainer: '#d0e6f2',
  tertiary: '#c7c2ea',
  onTertiary: '#2f2d4c',
  tertiaryContainer: '#464364',
  onTertiaryContainer: '#e3dfff',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  background: '#0f1417',
  onBackground: '#dfe3e7',
  surface: '#0f1417',
  onSurface: '#dfe3e7',
  surfaceVariant: '#40484c',
  onSurfaceVariant: '#c0c8cd',
  outline: '#8a9297',
  outlineVariant: '#40484c',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#dfe3e7',
  inverseOnSurface: '#2c3134',
  inversePrimary: '#136682',
} satisfies Partial<MD3Colors>;

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...brandLightColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...brandDarkColors,
  },
};
