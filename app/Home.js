import React from "react";
import { Camera } from "expo-camera";
import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View, ScrollView } from "react-native";
import ScrollIndicator from "react-native-scroll-indicator";
import { Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import Papa from "papaparse";
import NavBar from "./components/NavBar";
import { db } from "../db/db";
import { Scan, RefreshCw } from "lucide-react-native";

export default function Home() {
  // Camera State
  const [hasPermission, setHasPermission] = useState(null);
  const [readyCamera, setReadyCamera] = useState(false);
  const [scanData, setScanData] = useState();
  const [partNumber, setPartNumber] = useState();
  const [partLocation, setPartLocation] = useState([]);

  // File State
  const [datas, setDatas] = useState([]);
  const [filePath, setFilePath] = useState([]);
  const [fileName, setFileName] = useState([]);
  const [csvData, setCsvData] = useState();

  const timestamp = JSON.stringify(new Date().getTime());
  console.log("timestamp:", timestamp);

  console.log("filePath:", filePath);
  console.log("fileName:", fileName);
  console.log("csvData:", csvData);
  console.log("partNumber", partNumber);
  console.log("partLocation", partLocation);

  // _______________________________________________________________
  // Fetch Latest File: = OK

  const query = () => {
    console.log("Querying database");

    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXIST csvdatas (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, filepath TEXT)"
      );
    });

    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXIST scanhistory (id INTEGER PRIMARY KEY AUTOINCREMENT, partnumber TEXT, locations TEXT, timestamp TEXT)"
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
  const handleBarCodeScanned = ({ type, data }) => {
    setScanData(data);
    alert(`Part number ${data} scanned successfully!`);
    setReadyCamera(false);
    fetchLocations(data);
  };

  // Fetch locations of scanned part#:
  const fetchLocations = (data) => {
    console.log("data from function:", data);
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
            .slice(2)
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
      <View className="absolute w-full h-full p-5 z-40">
        <TouchableOpacity
          className=" absolute top-8 left-8 z-50 w-16 h-8 bg-zinc-800 rounded-md items-center justify-center"
          onPress={() => setReadyCamera(false)}
        >
          <Text className="text-zinc-100">Close</Text>
        </TouchableOpacity>
        <BarCodeScanner
          className="flex-1 items-center justify-center"
          onBarCodeScanned={scanData ? undefined : handleBarCodeScanned}
        />
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
      <View>
        <Text>Please grant camera permissions to app.</Text>
      </View>
    );
  }

  // _______________________________________________________________
  // UI
  return (
    <View className="flex-1 h-full items-center text-white justify-center bg-stone-50 z-30">
      <Camera />
      {readyCamera && renderCamera()}
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
      <Text className="absolute w-full text-rose-500 italic top-10 left-16 font-bold truncate">
        {fileName}
      </Text>
      <TouchableOpacity
        onPress={() => setReadyCamera(true)}
        className="bg-stone-100 border border-slate-200 w-60 h-60 rounded-full items-center justify-center shadow-2xl shadow-slate-500"
      >
        <Scan className=" text-zinc-700" size={88} />
      </TouchableOpacity>

      {scanData && (
        <View className="absolute w-full h-full items-center justify-center bg-stone-50 z-40">
          <View className="absolute top-5 w-11/12 h-[70vh] p-5 items-center bg-stone-50  z-50">
            <Text className="mt-1 font-bold text-zinc-800 text-xl">
              Part Number: {scanData}
            </Text>

            <View className="w-full h-[300px] mt-5 border border-stone-300 rounded-lg px-2">
              <Text className="font-bold text-rose-500 text-lg">
                Locations:
              </Text>

              <ScrollView className="w-full">
                {partLocation.map((location) => (
                  <Text className="italic mt-2 px-2" key={location}>
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
