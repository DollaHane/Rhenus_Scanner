import React from 'react'
import { Camera } from "expo-camera";
import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Alert } from 'react-native';
import { BarCodeScanner } from "expo-barcode-scanner";
import Papa from "papaparse";
import NavBar from './components/NavBar';
import { db } from '../db/db';

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
  const [fileName, setFileName] = useState([])
  const [csvData, setCsvData] = useState();

  const timestamp = JSON.stringify(new Date().getTime())
  console.log('timestamp:', timestamp)
  
  console.log('filePath:', filePath)
  console.log('fileName:', fileName)
  console.log('csvData:', csvData)
  console.log("partNumber", partNumber);
  console.log("partLocation", partLocation);



  // _______________________________________________________________
  // Fetch Latest File: = OK

  const query = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXIST csvdatas (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, filepath TEXT)"
      );
    });
  
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXIST scanhistory (id INTEGER PRIMARY KEY AUTOINCREMENT, partnumber TEXT, locations TEXT, timestamp TEXT)'
      );
    });
  
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM csvdatas',
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
  }

  useEffect(() => {
    query()
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
    translateCsv()
  }, [filePath]);



   // _______________________________________________________________
  // Scan barcode:
  const handleBarCodeScanned = ({ type, data }) => {
    setScanData(data);
    alert(`Part number ${data} scanned successfully!`);
    setReadyCamera(false);
    fetchLocations(data)
  };

  // Fetch locations of scanned part#:
  const fetchLocations = (data) => {
    console.log('data from function:', data)
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


  // ______________________________________________________________
// Save scan history
useEffect(() => {
  if (partLocation && partLocation.length > 0) {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'INSERT INTO scanhistory (partnumber, locations, timestamp) values (?, ?, ?)',
          [partNumber, JSON.stringify(partLocation)],
          (_, resultSet) => {
            console.log("resultSetId:", resultSet.insertId);
            console.log(`Successfully saved scan history of part number: ${partNumber}`);
          },
          (error) => {
            console.error(error);
          }
        );
      },
      (error) => {
        console.error(error);
      }
    );
  }
}, [partLocation]);




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
      <View className="absolute top-10 left-10 flex-row gap-5">
        
      </View>
      <TouchableOpacity
              className="absolute top-5 left-10 bg-zinc-800 text-stone-100 mt-5 w-20 h-10 items-center justify-center rounded-md"
              title="REFRESH"
              onPress={() => {
                query
              }}
            >
              <Text className="text-stone-100 font-semibold">REFRESH</Text>
            </TouchableOpacity>
      <Text className="absolute w-full text-rose-500 italic top-24 left-10 truncate">
        Selected file: {fileName}
      </Text>
      <TouchableOpacity
        onPress={() => setReadyCamera(true)}
        className="bg-stone-100 border border-slate-200 w-60 h-60 rounded-full items-center justify-center shadow-2xl shadow-slate-500"
      >
        <Text className="text-stone-800 text-3xl font-bold">SCAN</Text>
      </TouchableOpacity>

      {scanData && (
        <View className="absolute h-[500px] bottom-2 mb-5 p-5 items-center bg-stone-100 border border-stone-500 rounded-lg shadow-lg">
          <Text className="mt-1 font-bold text-rose-500 text-xl">
            Part Number: {scanData}
          </Text>

          <View className="w-11/12">
            <Text className="my-5 font-bold text-rose-500 text-lg">
              Locations:
            </Text>

            <View className="flex flex-wrap gap-2 w-full">
              {partLocation.map((location) => (
                <Text className="italic" key={location}>
                  {location}
                </Text>
              ))}
            </View>
          </View>

          <View className="flex flex-row gap-4">
            <TouchableOpacity
              className="bg-blue-900 text-stone-100 mt-5 w-20 h-10 items-center justify-center rounded-md"
              title="CLEAR"
              onPress={() => {
                setScanData(undefined);
                setPartLocation([]);
              }}
            >
              <Text className="text-stone-100 font-semibold">CLEAR</Text>
            </TouchableOpacity>
            <Text className="my-5 italic text-sm">Clear to scan again.</Text>
          </View>
        </View>
      )}

      <NavBar/>

    </View>
  );
}
