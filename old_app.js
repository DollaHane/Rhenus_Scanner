import { Camera } from "expo-camera";
import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Alert } from 'react-native';
import { BarCodeScanner } from "expo-barcode-scanner";
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";

export default function App() {
  // Camera State
  const [hasPermission, setHasPermission] = useState(null);
  const [readyCamera, setReadyCamera] = useState(false);
  const [scanData, setScanData] = useState();
  const [partNumber, setPartNumber] = useState();
  const [partLocation, setPartLocation] = useState([]);

  // File State
  const [file, setFile] = useState([]);
  const [csvData, setCsvData] = useState();

  console.log("partNumber", partNumber);
  console.log("partLocation", partLocation);

  // Document Picker:
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
      });

      if (result) {
        setFile(result.assets[0].name);
        fetch(result.assets[0].uri)
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
        Alert.alert("Document picking canceled or failed.");
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  // Scan barcode:
  const handleBarCodeScanned = ({ type, data }) => {
    setScanData(data);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    setReadyCamera(false);
  };

  // Fetch locations of scanned part#:
  const fetchLocations = () => {
    if (scanData) {
      const removeP = scanData.replace("P", "");
      // const replaceH = removeP.slice(0, -1) + "H" + removeP.slice(-2);
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
  }, [scanData, partNumber]);

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

  return (
    <View className="flex-1 items-center text-white justify-center bg-stone-50 z-30">
      <Camera />
      {readyCamera && renderCamera()}
      <View className="absolute top-10 left-10 flex-row gap-5">
        <TouchableOpacity
          onPress={pickDocument}
          className="w-20 h-10 bg-zinc-600 text-stone-50 items-center justify-center rounded-lg"
        >
          <Text className="text-stone-100">Select File</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFile([])}
          className="w-20 h-10 bg-zinc-600 text-stone-50 items-center justify-center rounded-lg"
        >
          <Text className="text-stone-100">Clear</Text>
        </TouchableOpacity>
      </View>
      <Text className="absolute w-full text-rose-500 italic top-24 left-10 truncate">
        Selected file: {file}
      </Text>
      <TouchableOpacity
        onPress={() => setReadyCamera(true)}
        // disabled={scanData}
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
              className="bg-zinc-700 text-stone-100 mt-5 w-20 h-10 items-center justify-center rounded-md"
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

    </View>
  );
}
