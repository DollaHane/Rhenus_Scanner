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
    <View>
      <View className="absolute top-10 left-10 flex-row gap-5">
        <TouchableOpacity
          onPress={pickDocument}
          className="w-20 h-10 bg-zinc-600 text-stone-50 items-center justify-center rounded-lg"
        >
          <Text className="text-zinc-100">Select File</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-20 h-10 bg-zinc-600 text-stone-50 items-center justify-center rounded-lg">
          <Text className="text-zinc-100">Clear</Text>
        </TouchableOpacity>
      </View>
      <Text className="absolute w-full text-rose-500 italic top-24 left-10 truncate">
        Selected file: {fileName}
      </Text>
      <View>
        {datas.map((files) => (
          <View key={files.id}>
            <Text>{files.filename}</Text>
            <Text>{files.filepath}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
