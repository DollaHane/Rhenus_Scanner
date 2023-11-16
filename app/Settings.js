import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { db } from "../db/db";

export default function Settings() {
  // File data
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");

  // All Files
  const [datas, setDatas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    <View className="p-2">
      <View className=" top-5 px-5 flex-row gap-5">
        <TouchableOpacity
          onPress={pickDocument}
          className="w-20 h-10 bg-zinc-800 text-stone-50 items-center justify-center rounded-lg"
        >
          <Text className="text-zinc-100">Select File</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-20 h-10 bg-zinc-800 text-stone-50 items-center justify-center rounded-lg">
          <Text className="text-zinc-100">Clear</Text>
        </TouchableOpacity>
      </View>

      <View className="w-full top-10 px-5 text-rose-500 italic truncate">
        <Text>Currently reading data from file name:</Text>
        {datas.length > 0 && <Text className='text-rose-500 italic font-bold'>{datas[0].filename}</Text>}
      </View>

      <View className="top-16 px-5 w-full">
        <Text className='font-bold text-xl'>Upload history:</Text>
        {datas.map((files) => (
          <View key={files.id}>
            <Text className='mt-5 pt-2 border-t-2 italic font-semibold border-stone-600'>{files.filename}</Text>
            <Text className='text-xs text-stone-400'>{files.filepath}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
