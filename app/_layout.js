import React from 'react'
import { Stack } from 'expo-router'


export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="Home"/>
      <Stack.Screen name="ScanOraclePart"/>
      <Stack.Screen name="ScanOracleLocation"/>
      <Stack.Screen name="OracleSettings"/>
      <Stack.Screen name="ScanSomiPart"/>
      <Stack.Screen name="ScanSomiLocation"/>
      <Stack.Screen name="SomiSettings"/>
    </Stack>
  )
}
