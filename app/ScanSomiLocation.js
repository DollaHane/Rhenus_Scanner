import React from "react";
import { Camera } from "expo-camera";
import { useState, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import { Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import SomiNavBar from "./components/SomiNavBar";
import { db } from "../db/db";
import { Scan, RefreshCw, Search, X, MapPinned } from "lucide-react-native";

// ***************************************************************
// This screen handles scanning locator barcodes to view the parts stored at that location..

export default function ScanOracleLocation() {
  // Camera State:
  const [readyCamera, setReadyCamera] = useState(false);
  const [scanData, setScanData] = useState();
  const [input, setInput] = useState();
  const [partNumber, setPartNumber] = useState([]);
  const [locator, setLocator] = useState();

  console.log("Somi Locator:", locator);

  // File State:
  const [filePath, setFilePath] = useState([]);
  const [fileName, setFileName] = useState([]);
  const [csvData, setCsvData] = useState();
  if (csvData) {
    console.log("csvData (Location):", csvData[1].data);
  }

  // Barcode Variables:
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;
  const viewMinX = (width - 350) / 2;
  const viewMinY = height / 2 - 120;
  const viewWidth = 350;
  const viewHeight = 120;

  // _______________________________________________________________
  // Fetch Latest File:

  const query = () => {
    console.log("Querying database");

    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXIST somi (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, filepath TEXT, date TEXT)"
      );
    });

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM somi",
        [],
        (txObj, resultSet) => {
          const data = resultSet.rows._array;
          const latestFile = data[data.length - 1];
          setFilePath(latestFile.filepath);
          setFileName(latestFile.filename);
        },
        (txObj, error) => console.log(error)
      );
    });

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM somidata",
        null,
        (txObj, resultSet) => {
          setCsvData(resultSet.rows._array);
        },
        (txObj, error) => console.log(error)
      );
    });

    console.log("Query complete..");
  };

  useEffect(() => {
    query();
  }, [db]);

  // _______________________________________________________________
  // Scan barcode:
  const handleBarCodeScanned = ({ data, bounds }) => {
    const { origin } = bounds;
    const isInCenteredRegion =
      origin.x >= viewMinX &&
      origin.y >= viewMinY &&
      origin.x <= viewMinX + 350 &&
      origin.y <= viewMinY + 295;

    if (isInCenteredRegion) {
      setScanData(data);
      alert(`Locator number ${data} scanned successfully!`);
      fetchPartNumbers(data);
    } else {
      console.log("Barcode is not in the centered region:", origin);
    }
  };

  // Manual Search:
  const handleManualSearch = (input) => {
    console.log("Manual Search:", input);
    setScanData(input);
    fetchPartNumbers(input);
  };

  // Fetch parts of scanned locator#:
  const fetchPartNumbers = (data) => {
    if (data) {
      setLocator(data);
    }

    if (locator && csvData) {
      // Still finding rows that include the scanned locator number.
      const matchingRows = []
      for (let i = 0; i < csvData.length; i++) {
        const data = csvData[i].data
        const parsedData = JSON.parse(data)
        if ( new RegExp(`(^|,)${locator}($|,)`).test(parsedData) ) {
          matchingRows.push(parsedData)
        }
      }
      console.log('matchingRows:', matchingRows)

      if (matchingRows) {
        if (matchingRows.length > 0) {
          // Create a formatted array of arrays "mainData"
          const mainData = [];
          // Split each string array using "," and remove empty items.
          function formatData(row) {
            const data = row[0];
            const newArray = data.split(",");
            return newArray;
          }

          // Use the "formatData" function for each row / array. This keeps each rown as a separate array.
          for (let i = 0; i < matchingRows.length; i++) {
            const formattedData = formatData(matchingRows[i]);
            mainData.push(formattedData);
          }

          // Filter the data you want returned.
          const displayData = mainData.map((subArray) => [
            subArray[0], // Part Number
            subArray[4], // Batch
            subArray[5], // Material Description
            subArray[subArray.length - 7], // Storage Bin
            subArray[subArray.length - 6], // Available Stock
            subArray[subArray.length - 4], // GR Date
          ]);
          setPartNumber(displayData);
        }
      } else {
        console.log(`Location number ${locator} not found.`);
      }
    } else {
      console.log("Location number is undefined.");
    }
  };

  useEffect(() => {
    fetchPartNumbers();
  }, [scanData]);

  // _______________________________________________________________
  // Display camera
  const renderCamera = () => {
    return (
      <View className="absolute w-full h-full z-40">
        <TouchableOpacity
          className=" absolute top-8 right-8 z-50 w-10 h-10 bg-stone-50 rounded-md items-center justify-center"
          onPress={() => setReadyCamera(false)}
        >
          <X className="text-zinc-800" />
        </TouchableOpacity>

        {/* BARCODE SCANNER */}
        <BarCodeScanner
          onBarCodeScanned={scanData ? undefined : handleBarCodeScanned}
          className="flex-1 items-center justify-center bg-black z-30"
        >
          <View
            style={{
              position: "absolute",
              left: viewMinX,
              top: viewMinY,
              width: viewWidth,
              height: viewHeight,
            }}
          >
            <View className="relative w-full h-full border-white">
              <View className="absolute top-0 left-0 h-10 w-10 border-t-4 border-t-blue-400 border-l-4 border-l-blue-400 rounded-tl-lg" />
              <View className="absolute top-0 right-0 h-10 w-10 border-t-4 border-t-blue-400 border-r-4 border-r-blue-400 rounded-tr-lg" />
              <View className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-b-blue-400 border-l-4 border-l-blue-400 rounded-bl-lg" />
              <View className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-b-blue-400 border-r-4 border-r-blue-400 rounded-br-lg" />
            </View>
          </View>
        </BarCodeScanner>
      </View>
    );
  };

  // _______________________________________________________________
  // UI
  return (
    <View className="flex-1 h-full items-center text-white justify-center bg-stone-50 z-30">
      {/* CAMERA COMPONENT */}

      <Camera />
      {readyCamera && renderCamera()}

      {/* FILE STATUS */}
      <TouchableOpacity
        className="absolute top-0 left-5 bg-stone-50 mt-5 w-10 h-10 items-center justify-center rounded-md"
        title="REFRESH"
        onPress={query}
      >
        <RefreshCw className="text-zinc-800" size={30} />
      </TouchableOpacity>
      <Text className="absolute w-full text-zinc-800 italic top-5 left-16 truncate">
        Selected file:
      </Text>
      <Text className="absolute w-full text-blue-500 italic top-10 left-16 font-bold truncate">
        {fileName}
      </Text>

      {/* SEARCH BAR */}
      <View className="absolute top-20 left-5 w-[90vw]">
        <View className="flex flex-row items-center justify-between">
          <TextInput
            value={input}
            onChangeText={(text) => setInput(text)}
            placeholder="Search parts by locator number.."
            className="w-full h-10 bg-zinc-100 border border-zinc-300 shadow-lg px-2 rounded-lg"
          />
          <TouchableOpacity
            title="Press me"
            onPress={() => handleManualSearch(input)}
            className="absolute w-16 h-10 right-0 bg-zinc-700 text-stone-50 items-center justify-center rounded-lg"
          >
            <Search className="text-zinc-100 font-bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SCAN BUTTON */}
      <TouchableOpacity
        onPress={() => setReadyCamera(true)}
        className="absolute top-[30vh] bg-stone-100 border border-slate-200 w-60 h-60 rounded-full items-center justify-center shadow-2xl shadow-slate-500"
      >
        <Scan className=" text-zinc-700" size={120} strokeWidth={1} />
        <MapPinned className="absolute text-zinc-700" size={40} />
      </TouchableOpacity>

      {/* SCANNED DATA */}
      {scanData && (
        <View className="absolute w-full h-full items-center justify-center bg-stone-50 z-40">
          <View className="absolute top-3 w-11/12 h-[75vh] p-2 items-center bg-stone-50 z-50">
            <Text className="font-bold text-zinc-800 text-xl">
              Locator Number:{" "}
              <Text className="w-28 font-bold text-blue-500">{locator}</Text>
            </Text>

            <ScrollView
              horizontal
              className="w-full mt-5 border border-stone-300 rounded-lg px-2"
            >
              <ScrollView>
                <View className="flex-row h-10 pt-1 border-b justify-center border-b-zinc-500">
                  <Text className="w-20 px-1 font-bold text-blue-500">
                    Part #:
                  </Text>
                  <Text className="w-32 px-1 font-bold text-blue-500">
                    Batch #:
                  </Text>
                  <Text className="w-44 px-1 font-bold text-blue-500">
                    Description:
                  </Text>
                  <Text className="w-20 px-1 font-bold text-blue-500 text-center">
                    Bin #:
                  </Text>
                  <Text className="w-20 px-1 font-bold text-blue-500 text-center">
                    Stock:
                  </Text>
                  <Text className="w-32 px-1 font-bold text-blue-500 text-center">
                    GR Date:
                  </Text>
                </View>

                <View className="">
                  {partNumber.map((partArray, index, innerIndex) => (
                    <View key={index} className="flex-row">
                      <Text
                        className="w-20 italic pt-1 px-1 pb-1 font-semibold text-sm border-b border-b-zinc-300 "
                        index={innerIndex}
                      >
                        {partArray[0]}
                      </Text>
                      <Text
                        className="w-32 italic pt-1 px-1 pb-1 font-semibold text-sm border-b border-b-zinc-300 border-l border-l-zinc-300"
                        index={innerIndex}
                      >
                        {partArray[1]}
                      </Text>
                      <Text
                        className="w-44 italic pt-1 px-1 pb-1 font-semibold text-sm border-b border-b-zinc-300 border-l border-l-zinc-300"
                        index={innerIndex}
                      >
                        {partArray[2]}
                      </Text>
                      <Text
                        className="w-20 italic pt-1 px-1 pb-1 font-semibold text-sm text-center border-b border-b-zinc-300 border-l border-l-zinc-300"
                        index={innerIndex}
                      >
                        {partArray[3]}
                      </Text>
                      <Text
                        className="w-20 italic pt-1 px-1 pb-1 font-semibold text-sm text-center border-b border-b-zinc-300 border-l border-l-zinc-300"
                        index={innerIndex}
                      >
                        {partArray[4]}
                      </Text>
                      <Text
                        className="w-32 italic pt-1 px-1 pb-1 font-semibold text-sm text-center border-b border-b-zinc-300 border-l border-l-zinc-300"
                        index={innerIndex}
                      >
                        {partArray[5]}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>

            <View className="absolute bottom-1 px-5 w-full h-16 flex flex-row items-center justify-between bg-stone-50">
              <Text className="italic text-lg ">Clear to scan again.</Text>
              <TouchableOpacity
                className="bg-zinc-800 text-stone-100 w-20 h-10 items-center justify-center rounded-md"
                title="CLEAR"
                onPress={() => {
                  setScanData(undefined);
                  setPartNumber([]);
                }}
              >
                <Text className="text-stone-100 font-semibold">CLEAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <SomiNavBar />
    </View>
  );
}
