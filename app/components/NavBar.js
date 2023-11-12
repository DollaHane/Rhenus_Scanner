import React from "react";
import { View } from "react-native";
import { Link } from "expo-router";

export default function NavBar() {
  return (
    <View className="absolute bottom-0 flex-row w-full h-16 items-center justify-around z-50 border-t-2 border-t-slate-200">
      <Link
        href="/History"
        className="mt-5 w-20 h-10 items-center justify-center rounded-md text-stone-800 font-semibold"
      >
        HISTORY
      </Link>
      <Link
        href="/Settings"
        className="mt-5 w-20 h-10 items-center justify-center rounded-md text-stone-800 font-semibold"
      >
        SETTINGS
      </Link>
    </View>
  );
}
