import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import HomeScreen from '../screens/HomeScreen'; 
import NoteScreen from '../screens/NoteScreen'; 

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}> 
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Note" component={NoteScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
