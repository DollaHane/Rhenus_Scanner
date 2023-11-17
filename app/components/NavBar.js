import React from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { History, FileCog } from "lucide-react-native";


export default function NavBar() {
  return (
    <View className="absolute bottom-0 flex-row w-full h-20 items-center justify-around z-50 border-t-2 border-t-slate-200">
      <Link
        href="/History"
        className="mt-5 w-20 h-20 items-center justify-center rounded-md text-stone-800 font-semibold"
      >
        <View>
          <History className="text-zinc-800 top-2 left-5 h-16 w-16" size={40}/>
        </View>
      </Link>
      <Link
        href="/Settings"
        className="flex mt-5 w-20 h-20 items-center justify-center rounded-md text-stone-800 font-semibold"
      >
        <View>
          <FileCog className="text-zinc-800 top-2 left-5 h-16 w-16" size={40}/>
        </View>
      </Link>
    </View>
  );
}
