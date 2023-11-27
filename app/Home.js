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
import BarcodeMask from "react-native-barcode-mask";
import Papa from "papaparse";
import NavBar from "./components/NavBar";
import { db } from "../db/db";
import { Scan, RefreshCw, Search, X } from "lucide-react-native";

export default function Home() {
  // Camera State:
  const [hasPermission, setHasPermission] = useState(null);
  const [readyCamera, setReadyCamera] = useState(false);
  const [scanData, setScanData] = useState();
  const [input, setInput] = useState();
  const [partNumber, setPartNumber] = useState();
  const [partLocation, setPartLocation] = useState([]);

  // File State:
  const [filePath, setFilePath] = useState([]);
  const [fileName, setFileName] = useState([]);
  const [csvData, setCsvData] = useState();

  // Barcode Variables:
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;
  const viewMinX = (width - 350) / 2;
  const viewMinY = height / 2 - 120;
  const viewWidth = 350;
  const viewHeight = 120;

  console.log("width", width);
  console.log("height", height);
  console.log("vmx", viewMinX);
  console.log("vmy", viewMinY);

  // _______________________________________________________________
  // Fetch Latest File:

  const query = () => {
    console.log("Querying database");

    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXIST csvdatas (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, filepath TEXT)"
      );
    });

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM csvdatas",
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
    console.log("Query complete..");
  };

  useEffect(() => {
    query();
  }, [db]);

  // _______________________________________________________________
  // Translate CSV File:
  const translateCsv = async () => {
    try {
      if (filePath) {
        fetch(filePath)
          .then((response) => response.text())
          .then((csvData) => {
            Papa.parse(csvData, {
              delimiter: ";",
              complete: function (results) {
                setCsvData(results.data);
              },
            });
          })
          .catch((error) => {
            console.error("Error reading the file:", error);
          });
      } else {
        Alert.alert("File URL not available.");
      }
    } catch (error) {
      console.error("Error translating CSV file:", error);
    }
  };

  useEffect(() => {
    translateCsv();
  }, [filePath]);

  // _______________________________________________________________
  // Scan barcode:
  const handleBarCodeScanned = ({ data, bounds }) => {
    const { origin } = bounds;

    const isInCenteredRegion =
      origin.x >= viewMinX &&
      origin.y >= viewMinY + 175 &&
      origin.x <= viewMinX + 350 &&
      origin.y <= viewMinY + 295;

    if (isInCenteredRegion) {
      if (data.includes("P") && data.length > 10) {
        setScanData(data);
        alert(`Part number ${data} scanned successfully!`);
        fetchLocations(data);
      } else {
        console.log(`Scanned data (${data}) is not a valid part number..`);
      }
    } else {
      console.log("Barcode is not in the centered region:", origin);
    }
  };

  // Manual Search:
  const handleManualSearch = (input) => {
    console.log("Manual Search:", input);
    setScanData(input);
    fetchLocations(input);
  };

  // Fetch locations of scanned part#:
  const fetchLocations = (data) => {
    if (data) {
      const removeP = data.replace("P", "");
      setPartNumber(removeP);
    }

    if (partNumber && csvData) {
      const stringArray = csvData.find((row) => row[0].includes(partNumber));
      if (stringArray) {
        if (stringArray.length > 0) {
          console.log("array", stringArray);
          const data = stringArray[0];
          const newArray = data.split(",");
          const newData = newArray
            .slice(3)
            .filter((item) => item.trim() !== "");
          setPartLocation(newData);
        }
      } else {
        console.log(`Part number ${partNumber} not found.`);
      }
    } else {
      console.log("Part number is undefined.");
    }
  };

  useEffect(() => {
    fetchLocations();
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
            <View className='relative w-full h-full border-white'>
              <View className='absolute top-0 left-0 h-10 w-10 border-t-4 border-t-blue-400 border-l-4 border-l-blue-400 rounded-tl-lg'/>
              <View className='absolute top-0 right-0 h-10 w-10 border-t-4 border-t-blue-400 border-r-4 border-r-blue-400 rounded-tr-lg'/>
              <View className='absolute bottom-0 left-0 h-10 w-10 border-b-4 border-b-blue-400 border-l-4 border-l-blue-400 rounded-bl-lg'/>
              <View className='absolute bottom-0 right-0 h-10 w-10 border-b-4 border-b-blue-400 border-r-4 border-r-blue-400 rounded-br-lg'/>
            </View>
          </View>
        </BarCodeScanner>
      </View>
    );
  };

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
            placeholder="Search part number.."
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
        className="absolute top-44 bg-stone-100 border border-slate-200 w-60 h-60 rounded-full items-center justify-center shadow-2xl shadow-slate-500"
      >
        <Scan className=" text-zinc-700" size={88} />
      </TouchableOpacity>

      {/* SCANNED DATA */}
      {scanData && (
        <View className="absolute w-full h-full items-center justify-center bg-stone-50 z-40">
          <View className="absolute top-0 w-11/12 h-[75vh] p-5 items-center bg-stone-50  z-50">
            <Text className="font-bold text-zinc-800 text-xl">
              Part Number: {partNumber}
            </Text>

            <View className="w-full h-[350px] mt-5 border border-stone-300 rounded-lg px-2">
              <Text className="font-bold text-blue-500 text-lg">
                Locations:
              </Text>

              <ScrollView className="w-full">
                {partLocation.map((location) => (
                  <Text
                    className="italic mt-2 px-2 font-semibold text-xl"
                    key={location}
                  >
                    - {location}
                  </Text>
                ))}
              </ScrollView>
            </View>

            <View className="absolute bottom-5 w-full flex flex-row items-center justify-between">
              <Text className="italic text-lg ">Clear to scan again.</Text>
              <TouchableOpacity
                className="bg-zinc-800 text-stone-100 w-20 h-10 items-center justify-center rounded-md"
                title="CLEAR"
                onPress={() => {
                  setScanData(undefined);
                  setPartLocation([]);
                }}
              >
                <Text className="text-stone-100 font-semibold">CLEAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <NavBar />
    </View>
  );
}
