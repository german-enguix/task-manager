// Global types for the application
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
}

export type NavigationProps = {
  navigation: any;
  route: any;
};

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};
