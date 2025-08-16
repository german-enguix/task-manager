# Tasks Concept 📱

Una aplicación React Native moderna construida con Expo, TypeScript, React Native Paper y las mejores prácticas de desarrollo.

## 📚 Documentación

- Setup completo: `docs/SETUP.md`
- Funcionalidades (notificaciones, timers, asignación múltiple, storage, proyectos, reportes): `docs/FEATURES.md`
- Solución de problemas: `docs/TROUBLESHOOTING.md`

## 🚀 Características

- **React Native 0.79.5** con **React 19**
- **Expo 53** con configuración optimizada
- **React Native Paper** para componentes Material Design
- **TypeScript** con configuración estricta
- **Estructura modular** y escalable
- **ESLint + Prettier** para código consistente
- **Componentes reutilizables** con props tipadas
- **Tema claro/oscuro** con React Native Paper
- **Página Home** con card "Hola Mundo" y funcionalidad de fichaje
- **Gestión de estado** con hooks de React
- **Sistema de colores** y constantes centralizadas
- **Utilidades** comunes incluidas

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)

```bash
npm install -g @expo/cli
```

## 🛠️ Instalación

1. **Clona el repositorio**

```bash
git clone <tu-repositorio-url>
cd tasks-concept
```

2. **Instala las dependencias**

```bash
npm install
```

3. **Inicia el proyecto**

```bash
npm start
```

## 📱 Ejecutar la Aplicación

### Desarrollo Local

```bash
# Inicia el servidor de desarrollo
npm start

# Ejecuta en Android
npm run android

# Ejecuta en iOS
npm run ios

# Ejecuta en Web
npm run web
```

### Usando Expo Go

1. Instala [Expo Go](https://expo.dev/client) en tu dispositivo móvil
2. Escanea el código QR que aparece en la terminal
3. La aplicación se cargará automáticamente

## 🏗️ Estructura del Proyecto

```
tasks-concept/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Button.tsx      # Componente de botón personalizado
│   │   ├── PaperButton.tsx # Botón con React Native Paper
│   │   ├── PaperCard.tsx   # Card con React Native Paper
│   │   ├── PaperInput.tsx  # TextInput con React Native Paper
│   │   ├── PaperChip.tsx   # Chip con React Native Paper
│   │   └── index.ts        # Exportaciones de componentes
│   ├── constants/          # Constantes de la aplicación
│   │   ├── index.ts        # Colores, tamaños, configuración
│   │   └── theme.ts        # Configuración de temas Paper
│   ├── context/            # Context providers
│   ├── hooks/              # Custom hooks
│   │   ├── useCounter.ts   # Hook para contador
│   │   └── index.ts        # Exportaciones de hooks
│   ├── screens/            # Pantallas de la aplicación
│   │   ├── HomeScreen.tsx  # Pantalla principal con Hola Mundo y fichaje
│   │   └── index.ts        # Exportaciones de pantallas
│   ├── services/           # Servicios API y lógica externa
│   ├── types/              # Definiciones de tipos TypeScript
│   │   └── index.ts        # Tipos globales
│   └── utils/              # Funciones utilitarias
│       └── index.ts        # Utilidades comunes
├── assets/                 # Recursos estáticos
├── App.tsx                 # Componente principal
├── app.json               # Configuración de Expo
├── tsconfig.json          # Configuración de TypeScript
├── .eslintrc.js           # Configuración de ESLint
├── .prettierrc.js         # Configuración de Prettier
└── package.json           # Dependencias y scripts
```

## 📋 Reglas de Desarrollo

### 🎨 React Native Paper - Uso Exclusivo

**OBLIGATORIO**: Este proyecto utiliza ÚNICAMENTE componentes de React Native Paper.

#### Componentes Permitidos

- **React Native Paper Components**: Todos los componentes oficiales de la librería
- **Componentes del Proyecto**: Solo los wrappers/adaptadores creados en `src/components/`
- **React Native Core**: Solo `View`, `ScrollView`, `SafeAreaView`, `StatusBar`

#### Componentes Incluidos en el Proyecto

- **PaperButtonComponent**: Botón con variantes contained, outlined, text
- **PaperCard**: Tarjeta con título, subtítulo y contenido
- **PaperInput**: Input de texto con validación y helper text
- **PaperChip**: Chip con variantes filled/outlined

#### ❌ Prácticas Prohibidas

- **NO** crear componentes personalizados sin usar React Native Paper
- **NO** usar componentes con clases (solo functional components)
- **NO** inventar componentes nuevos sin base en Paper
- **NO** usar librerías UI externas (react-native-elements, NativeBase, etc.)
- **NO** usar componentes básicos de React Native para UI (Text, Button, TextInput, etc.)

#### ✅ Buenas Prácticas

- **SÍ** usar componentes de Paper directamente cuando sea apropiado
- **SÍ** crear wrappers tipados sobre componentes Paper para casos específicos
- **SÍ** seguir los patrones establecidos en los componentes existentes
- **SÍ** usar TypeScript con tipado estricto
- **SÍ** aplicar temas consistentes a través de PaperProvider

### 🎯 Material Design Guidelines

Seguir estrictamente las [Material Design Guidelines](https://m3.material.io/) y la [documentación oficial de React Native Paper](https://callstack.github.io/react-native-paper/).

#### Principios Fundamentales

- **Material You**: Usar el sistema de colores dinámicos M3
- **Elevation**: Aplicar elevación correcta según la jerarquía
- **Motion**: Implementar animaciones siguiendo los principios Material
- **Typography**: Usar la escala tipográfica M3 consistentemente
- **Spacing**: Seguir el sistema de espaciado de 8dp

### 📱 Layout Standards para Mobile

#### Sistema de Espaciado (8dp Grid)

```typescript
// Espaciado estandarizado
export const SPACING = {
  xs: 4,    // 4dp - micro espacios
  sm: 8,    // 8dp - pequeño
  md: 16,   // 16dp - medio (base)
  lg: 24,   // 24dp - grande
  xl: 32,   // 32dp - extra grande
  xxl: 40,  // 40dp - secciones principales
} as const;
```

#### Paddings y Margins Estandarizados

```typescript
// Containers principales
const CONTAINER_PADDING = {
  horizontal: SPACING.md,  // 16dp laterales
  vertical: SPACING.lg,    // 24dp superior/inferior
};

// Cards y componentes
const CARD_SPACING = {
  padding: SPACING.md,     // 16dp interno
  marginBottom: SPACING.md, // 16dp entre cards
};

// Botones y elementos interactivos
const BUTTON_SPACING = {
  marginVertical: SPACING.sm,  // 8dp vertical
  minHeight: 48,               // Mínimo touch target
};
```

#### Estructura de Pantalla Consistente

```typescript
// Template para pantallas
const ScreenTemplate = () => (
  <Surface style={styles.container}>
    <Surface style={styles.header}>
      {/* Header con elevación */}
    </Surface>
    
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Contenido con padding estandarizado */}
    </ScrollView>
  </Surface>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
});
```

#### Composiciones Recomendadas

1. **Gap entre secciones**: `SPACING.xl` (32dp)
2. **Gap entre elementos relacionados**: `SPACING.md` (16dp)
3. **Gap entre elementos de lista**: `SPACING.sm` (8dp)
4. **Padding horizontal de pantalla**: `SPACING.md` (16dp)
5. **Padding vertical de secciones**: `SPACING.lg` (24dp)

#### Breakpoints y Responsive Design

```typescript
// Breakpoints para diferentes tamaños
export const BREAKPOINTS = {
  small: 320,   // Teléfonos pequeños
  medium: 375,  // Teléfonos estándar
  large: 414,   // Teléfonos grandes
  tablet: 768,  // Tablets
} as const;
```

### 🔧 Implementación de Componentes

#### Template para Nuevos Componentes

```typescript
import React from 'react';
import { ComponentProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { SPACING } from '@/constants';

interface CustomComponentProps extends ComponentProps<PaperComponent> {
  // Props específicas
}

export const CustomComponent: React.FC<CustomComponentProps> = ({
  style,
  ...props
}) => {
  return (
    <PaperComponent
      style={[styles.container, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    margin: SPACING.md,
    // Seguir estándares de espaciado
  },
});
```

#### Validación Obligatoria

Antes de crear cualquier componente, verificar:

1. ✅ ¿Existe un componente Paper equivalente?
2. ✅ ¿Es necesario crear un wrapper?
3. ✅ ¿Sigue las guidelines de Material Design?
4. ✅ ¿Usa el sistema de espaciado estandarizado?
5. ✅ ¿Tiene tipado TypeScript completo?

## 🎨 React Native Paper

### Tema Personalizado

```typescript
// Tema claro personalizado
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    secondary: '#5856D6',
    tertiary: '#34C759',
    // ... más colores
  },
};

// Tema oscuro personalizado
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#007AFF',
    secondary: '#5856D6',
    tertiary: '#34C759',
    // ... más colores
  },
};
```

### Uso en la Aplicación

```typescript
import { PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from '@/constants';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      {/* Tu aplicación aquí */}
    </PaperProvider>
  );
}
```

## 🏠 Página Home

La aplicación incluye una página principal (`HomeScreen`) que demuestra el uso de los componentes creados:

### Características

- **Card "Hola Mundo"**: Mensaje de bienvenida con información de la aplicación
- **Sistema de Fichaje**: Botón funcional para registrar entrada/salida
- **Header dinámico**: Muestra la fecha actual formateada
- **Diseño responsive**: Adaptado para diferentes tamaños de pantalla
- **Notificaciones**: Alert con confirmación de fichaje y hora actual

### Componentes utilizados

- `PaperCard`: Para las tarjetas de contenido
- `PaperButtonComponent`: Para el botón de fichaje
- `Surface`: Para el header con elevación
- `Text`: Variantes tipográficas de Paper

```typescript
// Funcionalidad del fichaje
const handleFichar = () => {
  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  Alert.alert(
    'Fichaje registrado',
    `Has fichado correctamente a las ${currentTime}`,
    [{ text: 'OK', style: 'default' }]
  );
};
```

## 📦 Dependencias Principales

- **expo**: Framework para React Native
- **react**: Biblioteca de UI
- **react-native**: Framework móvil
- **react-native-paper**: Componentes Material Design
- **typescript**: Superset de JavaScript tipado
- **@expo/vector-icons**: Iconos para Expo
- **expo-status-bar**: Barra de estado
- **react-native-safe-area-context**: Área segura

## 🔧 Herramientas de Desarrollo

- **ESLint**: Linter para JavaScript/TypeScript
- **Prettier**: Formateador de código
- **TypeScript**: Verificación de tipos estática

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm start              # Inicia el servidor de desarrollo
npm run android        # Ejecuta en Android
npm run ios           # Ejecuta en iOS
npm run web           # Ejecuta en web

# Linting y Formateo
npm run lint          # Ejecuta ESLint
npm run lint:fix      # Arregla problemas de ESLint automáticamente
npm run format        # Formatea el código con Prettier
npm run type-check    # Verifica tipos de TypeScript
```

## 📝 Convenciones de Código

### Naming Conventions

- **Componentes**: PascalCase (`Button`, `UserProfile`, `PaperCard`)
- **Archivos**: camelCase (`userService.ts`, `authUtils.ts`)
- **Directorios**: kebab-case (`user-profile`, `auth-components`)
- **Funciones**: camelCase (`handlePress`, `formatDate`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)

### Estructura de Componentes

```typescript
// Imports
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';

// Types
interface ComponentProps {
  title: string;
  onPress: () => void;
}

// Component
export const Component: React.FC<ComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">{title}</Text>
      <Button mode="contained" onPress={onPress}>
        Presionar
      </Button>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

## 🌟 Características de React Native Paper

### Componentes Disponibles

- **Buttons**: Contained, Outlined, Text
- **Cards**: Surface, Card.Content, Card.Actions
- **Text Inputs**: Outlined, Flat con validación
- **Navigation**: Bottom Navigation, Tabs
- **Surfaces**: Surface, Paper con elevation
- **Lists**: List.Item, List.Section
- **Chips**: Input, Choice, Filter
- **Dialogs**: Alert, Portal
- **Snackbars**: Notificaciones temporales

### Ejemplos de Uso

```typescript
// Botón con Paper
<Button mode="contained" onPress={handlePress}>
  Presionar
</Button>

// Input con validación
<TextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={!!emailError}
  mode="outlined"
/>

// Card con contenido
<Card>
  <Card.Content>
    <Title>Título</Title>
    <Paragraph>Contenido de la tarjeta</Paragraph>
  </Card.Content>
</Card>
```

## 🔄 Próximos Pasos

1. **Navegación**: Implementar navegación con React Navigation
2. **Estado Global**: Añadir Context API o Redux Toolkit
3. **Autenticación**: Implementar sistema de login/registro
4. **API Integration**: Conectar con servicios backend
5. **Testing**: Añadir Jest y React Native Testing Library
6. **Más componentes Paper**: Expandir la librería de componentes
7. **Animaciones**: Añadir Reanimated para animaciones fluidas
8. **CI/CD**: Configurar pipeline de deployment

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes alguna pregunta o problema, no dudes en abrir un issue en el repositorio.

---

**¡Feliz codificación con React Native Paper!** 🎉
