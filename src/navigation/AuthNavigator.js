import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import BranchSelectScreen from '../screens/auth/BranchSelectScreen';
import colors from '../theme/colors';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="BranchSelect" component={BranchSelectScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
