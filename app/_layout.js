import React from 'react'
import { Stack } from 'expo-router'
import NavBar from './components/NavBar'


export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="Home"/>
      <Stack.Screen name="History"/>
      <Stack.Screen name="Settings"/>
    </Stack>
  )
}
