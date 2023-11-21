import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Info, X } from "lucide-react-native";
import { db } from "../db/db";

export default function Settings() {
  // File data
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");

  // All Files
  const [datas, setDatas] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [info, setInfo] = useState(false);

  //_________________________________________________________
  // Load initial state:
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS csvdatas (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, filepath TEXT)"
      );
    });

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM csvdatas",
        null,
        (txObj, resultSet) => {
          setDatas(resultSet.rows._array);
          console.log("datas:", datas);
        },

        (txObj, error) => console.log(error)
      );
    });
  }, [db, filePath]);

  useEffect(() => {
    if (datas.length > 0) {
      setIsLoading(false);
    }
  }, [datas]);

  //_________________________________________________________
  // Get the latest file being used:
  const getLatestFile = () => {
    if (datas.length > 0) {
      const latestFile = datas[datas.length - 1];
      setFileName(latestFile.filename);
      setFilePath(latestFile.filepath);
    }
  };

  useEffect(() => {
    getLatestFile();
  }, [datas]);

  //_________________________________________________________
  // Delete old entries:
  const clearHistory = () => {
    const firstItem = datas[0];

    if (datas.length > 5) {
      const itemId = firstItem.id;

      db.transaction((tx) => {
        tx.executeSql(
          "DELETE FROM csvdatas WHERE id = ?",
          [itemId],
          (txObj, resultSet) => {
            console.log(
              `Successfully deleted file of id: ${itemId}. Result:`,
              resultSet
            );
          },
          (txObj, error) => console.log(error)
        );
      });
    }
  };

  useEffect(() => {
    clearHistory();
  }, [datas]);

  //_________________________________________________________
  // Document Picker:
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
      });

      const path = result.assets[0].uri;
      const name = result.assets[0].name;
      console.log("path:", path);
      console.log("db:", db);

      db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO csvdatas (filename, filepath) values (?, ?)",
          [name, path],
          (txObj, resultSet) => {
            console.log("resultSetId:", resultSet.insertId);
            console.log(`Successfully added file: ${name}`);
            setFileName(name);
            setFilePath(path);
          },
          (error) => {
            console.error(error);
          }
        );
      });
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  return (
    <View className="p-2 w-full h-full bg-stone-50">


      {/* LOADING STATE */}
      {isLoading === true && (
        <View className="flex w-full h-full bg-white items-center rounded-lg">
          <Text className="top-44 text-2xl">Loading..</Text>
        </View>
      )}


      {/* SETTINGS PAGE INFO MODAL */}
      {info === true && (
        <View className="flex w-full h-full bg-stone-50 rounded-lg">
          <View>
            <TouchableOpacity
              onPress={() => setInfo(false)}
              className="absolute w-20 h-10 top-5 right-5 bg-stone-50 text-stone-50 items-center justify-center rounded-lg"
            >
              <X className="text-zinc-800" size={30} />
            </TouchableOpacity>
          </View>
          <View className="w-full h-full top-5 px-5 items-start">
            <Text className="text-2xl font-bold text-zinc-800">User Guide:</Text>
            <Text className="text-lg mt-5 font-semibold text-zinc-800">File Selection:</Text>
            <Text className="mt-2 text-zinc-700 text-xs">
              A valid .csv file is required in order to complete a scan cycle on this application. 
              To select a file, press the <Text  className='italic font-semibold'>"Select File"</Text> button on the 
              <Text className='italic font-semibold'>"Settings"</Text> page. A .csv file can then be selected from 
              any directory on the device. (Moving the file will result in errors / broken file path.)  
            </Text>
            <Text className="mt-2 text-zinc-700 text-xs">
              The currently selected file will be displayed under <Text className='italic font-semibold'>"Currently reading data from file name:"</Text> which 
              represents the .csv file being used to find the locations of parts based on the part number scanned.
            </Text>
            <Text className="text-lg mt-5 font-semibold text-zinc-800">CSV File Format:</Text>
            <Text className="mt-2 text-zinc-700 text-xs">
              In order to correctly process the data within the selected .csv file, all the data needs to appear 
              within the first column of the .csv file.   
            </Text>
            <Text className="mt-2 text-zinc-700 text-xs italic font-semibold">
              Eg.: ",1E04957H01,WCC-13-3..,WCS-4-2..,1109C..," 
            </Text>
            <Text className="mt-2 text-zinc-700 text-xs">
              As per the above example, after a successful scan event, the application searches for a matching the part number (first entry in the string) 
              and then returns that part numbers warehouse locations (subsequent entries seperated by a comma).
            </Text>
            <Text className="mt-5 text-zinc-700 text-base italic font-bold">
              (Please contact the developer in the event the structure of the .csv file has been revised.)
            </Text>
          </View>
        </View>
      )}


      {/* SETTINGS PAGE UI */}
      <View className="top-5 px-5 flex-row justify-between">
        <TouchableOpacity
          onPress={pickDocument}
          className="w-28 h-10 bg-zinc-800 text-stone-50 items-center justify-center rounded-lg"
        >
          <Text className="text-zinc-100 font-bold">Select File</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setInfo(true)}
          className="w-20 h-10 bg-stone-50 text-stone-50 items-center justify-center rounded-lg"
        >
          <Info className="text-zinc-800" size={30} />
        </TouchableOpacity>
      </View>

      <View className="w-full top-10 px-5 text-rose-500 italic truncate">
        <Text>Currently reading data from file name:</Text>
        {fileName && (
          <Text className="text-rose-500 italic font-bold">{fileName}</Text>
        )}
      </View>

      <View className="top-16 px-5 w-full">
        <Text className="font-bold text-xl">Selection History:</Text>
        {datas.map((files) => (
          <View key={files.id}>
            <Text className="mt-5 pt-2 border-t-2 italic font-semibold border-stone-600">
              {files.filename}
            </Text>
            <Text className="text-xs text-stone-400">{files.filepath}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
