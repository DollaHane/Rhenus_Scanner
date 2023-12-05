import React, { useState, useEffect } from "react";
import {
  View, Text,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Link } from "expo-router";
import NavBar from "./components/NavBar";
import { Group, MapPinned } from "lucide-react-native";

export default function Home() {
  const [hasPermission, setHasPermission] = useState(null);
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (!hasPermission) {
    return (
      <View className="items-center justify-center">
        <Text className="text-xl font-semibold">
          Please grant camera permissions to app.
        </Text>
      </View>
    );
  }

  // _______________________________________________________________
  // UI
  return (
    <View className="flex-1 h-full items-center text-white gap- bg-stone-50 z-30">
      <View className='flex-col h-[60vh] top-10 items-center'>
        
        <Link href="/ScanPart" className='shadow-2xl mb-5 h-44'>
          <View className="flex mt-5 w-[80vw] h-36 items-center justify-center rounded-3xl text-stone-800 font-semibold border border-slate-200 bg-stone-50 shadow-2xl shadow-slate-500">
            <Group className="text-blue-500 h-28 w-28" size={40}/>
            <Text className='text-xl mt-5 font-semibold'>Scan Part Barcode</Text>
          </View>
        </Link>
        <Link href="/ScanLocation" className='h-44'>
          <View className="flex mt-5 w-[80vw] h-36 mb-5 items-center justify-center rounded-3xl text-stone-800 font-semibold border border-slate-200 bg-stone-50 shadow-2xl shadow-slate-500">
            <MapPinned className="text-blue-500 h-28 w-28" size={40}/>
            <Text className='text-xl mt-5 font-semibold'>Scan Locator Barcode</Text>
          </View>
        </Link>
      </View>
      <NavBar />
    </View>
  );
}
