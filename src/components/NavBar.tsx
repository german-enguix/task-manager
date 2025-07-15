import React from 'react';
import { BottomNavigation } from 'react-native-paper';
import { NavigationRoute } from '@/types';

interface NavBarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentRoute, onNavigate }) => {
  const [index, setIndex] = React.useState(
    currentRoute === 'Home' ? 0 : 1
  );

  const routes = [
    { key: 'Home', title: 'Mi día', focusedIcon: 'calendar-today', unfocusedIcon: 'calendar-today' },
    { key: 'Projects', title: 'Mis proyectos', focusedIcon: 'folder-multiple', unfocusedIcon: 'folder-multiple-outline' },
  ];

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    const routeKey = routes[newIndex].key as NavigationRoute;
    onNavigate(routeKey);
  };

  // Sincronizar el índice cuando cambia currentRoute externamente
  React.useEffect(() => {
    const newIndex = currentRoute === 'Home' ? 0 : 1;
    if (newIndex !== index) {
      setIndex(newIndex);
    }
  }, [currentRoute, index]);

  return (
    <BottomNavigation.Bar
      navigationState={{ index, routes }}
      onTabPress={({ route, preventDefault }) => {
        const newIndex = routes.findIndex(r => r.key === route.key);
        if (newIndex !== -1) {
          handleIndexChange(newIndex);
        }
      }}
    />
  );
};

export default NavBar; 