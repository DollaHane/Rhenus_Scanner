import React, { useState, useEffect } from "react";
import {
  View, Text,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Link } from "expo-router";
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
    <View className="flex h-[80vh] items-center text-white bg-stone-50 z-30">
      <View className='flex-col h-full top-5 items-center justify-between'>
        <Link href="/ScanOraclePart" className='h-32'>
          <View className="flex mt-5 w-[80vw] h-32 items-center justify-center rounded-3xl text-stone-800 font-semibold border border-slate-200 bg-stone-50 shadow-2xl shadow-slate-500">
            <View className='absolute left-1 top-1 h-8 w-24 items-center justify-center  bg-amber-200 rounded-full shadow-md shadow-slate-500'>
              <Text className='text-zinc-800 font-semibold'>ORACLE TK</Text>
            </View>
            <Group className="text-blue-500 h-28 w-28" size={40}/>
            <Text className='text-xl mt-5 font-semibold'>Scan Part Barcode</Text>
          </View>
        </Link>
        <Link href="/ScanOracleLocation" className='h-32'>
          <View className="flex mt-5 w-[80vw] h-32 mb-5 items-center justify-center rounded-3xl text-stone-800 font-semibold border border-slate-200 bg-stone-50 shadow-2xl shadow-slate-500">
            <View className='absolute left-1 top-1 h-8 w-24 items-center justify-center  bg-amber-200 rounded-full shadow-md shadow-slate-500'>
              <Text className='text-zinc-800 font-semibold'>ORACLE TK</Text>
            </View>
            <MapPinned className="text-blue-500 h-28 w-28" size={40}/>
            <Text className='text-xl mt-5 font-semibold'>Scan Locator Barcode</Text>
          </View>
        </Link>
        <Link href="/ScanSomiPart" className='relative h-32'>
          <View className="flex mt-5 w-[80vw] h-32 items-center justify-center rounded-3xl text-stone-800 font-semibold border border-slate-200 bg-stone-50 shadow-2xl shadow-slate-500">
            <View className='absolute left-1 top-1 h-8 w-24 items-center justify-center  bg-lime-300 rounded-full shadow-md shadow-slate-500'>
              <Text className='text-zinc-800 font-semibold'>SOMI / SAP</Text>
            </View>
            <Group className="text-blue-500 h-28 w-28" size={40}/>
            <Text className='text-xl mt-5 font-semibold'>Scan Part Barcode</Text>
          </View>
        </Link>
        <Link href="/ScanSomiLocation" className='h-32'>
          <View className="flex mt-5 w-[80vw] h-32 mb-5 items-center justify-center rounded-3xl text-stone-800 font-semibold border border-slate-200 bg-stone-50 shadow-2xl shadow-slate-500">
            <View className='absolute left-1 top-1 h-8 w-24 items-center justify-center  bg-lime-300 rounded-full shadow-md shadow-slate-500'>
              <Text className='text-zinc-800 font-semibold'>SOMI / SAP</Text>
            </View>
            <MapPinned className="text-blue-500 h-28 w-28" size={40}/>
            <Text className='text-xl mt-5 font-semibold'>Scan Locator Barcode</Text>
          </View>
        </Link>
      </View>
    </View>
  );
}
