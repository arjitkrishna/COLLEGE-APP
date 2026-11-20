import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import TimetableScreen from '../screens/timetable/TimetableScreen';
import ChannelListScreen from '../screens/channels/ChannelListScreen';
import ChatScreen from '../screens/channels/ChatScreen';
import NewMessageScreen from '../screens/channels/NewMessageScreen';
import CreateChannelScreen from '../screens/channels/CreateChannelScreen';
import ManageCreatorsScreen from '../screens/channels/ManageCreatorsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const ChannelsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const ChannelsStackNavigator = () => {
  return (
    <ChannelsStack.Navigator
      initialRouteName="ChannelList"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <ChannelsStack.Screen name="ChannelList" component={ChannelListScreen} />
      <ChannelsStack.Screen name="Chat" component={ChatScreen} />
      <ChannelsStack.Screen name="NewMessage" component={NewMessageScreen} />
      <ChannelsStack.Screen name="CreateChannel" component={CreateChannelScreen} />
      <ChannelsStack.Screen name="ManageCreators" component={ManageCreatorsScreen} />
    </ChannelsStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Attendance':
              iconName = 'chart-bar';
              break;
            case 'Timetable':
              iconName = 'calendar-clock';
              break;
            case 'Channels':
              iconName = 'message-text';
              break;
            case 'Profile':
              iconName = 'account-circle';
              break;
            default:
              iconName = 'circle';
          }
          return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
        }}
      />
      <Tab.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{
          tabBarLabel: 'Timetable',
        }}
      />
      <Tab.Screen
        name="Channels"
        component={ChannelsStackNavigator}
        options={{
          tabBarLabel: 'Channels',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default MainTabNavigator;
