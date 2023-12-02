import React from 'react'
import { Stack } from 'expo-router'


export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="Home"/>
      <Stack.Screen name="ScanPart"/>
      <Stack.Screen name="ScanLocation"/>
      <Stack.Screen name="Settings"/>
    </Stack>
  )
}
