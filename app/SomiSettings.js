import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Info, X } from "lucide-react-native";
import { db } from "../db/db";
import Papa from "papaparse";

export default function SomiSettings() {
  // ******************** STATE MANAGEMENT ********************

  // File data
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [csvData, setCsvData] = useState([]);
  console.log("csvData Length:", csvData.length);

  // All Files
  const [datas, setDatas] = useState([]);
  const [info, setInfo] = useState(false);

  // Create timestamp
  const newDate = new Date();
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(newDate.toLocaleString());
    console.log("date:", date);
  }, [newDate]);

  // ******************** DATABASE MANAGEMENT ********************

  useEffect(() => {
    //___________________________
    // Create "somi" table for document file path..
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS somi (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, filepath TEXT, date TEXT)"
      );
    });

    //___________________________
    // Create "somidata" table to store the csv data..
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS somidata (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, date TEXT)"
      );
    });

    //___________________________
    // Fetch file paths to display history of selected files
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM somi ORDER BY id DESC",
        null,
        (txObj, resultSet) => {
          setDatas(resultSet.rows._array);
        },
        (txObj, error) => console.log(error)
      );
    });
  }, [db, filePath]);

  //___________________________
  // Get the latest file being used:
  const getLatestFile = () => {
    if (datas.length > 0) {
      const latestFile = datas[0];
      setFileName(latestFile.filename);
      setFilePath(latestFile.filepath);
    }
  };

  useEffect(() => {
    getLatestFile();
  }, [datas]);

  //___________________________
  // Delete old file paths:
  const clearHistory = () => {
    const oldestItem = datas[datas.length - 1];

    if (datas.length > 5) {
      const itemId = oldestItem.id;

      db.transaction((tx) => {
        tx.executeSql(
          "DELETE FROM somi WHERE id = ?",
          [itemId],
          (txObj, resultSet) => {
            console.log(`Successfully deleted file of id: ${itemId}. Result:`);
          },
          (txObj, error) => console.log(error)
        );
      });
    }
  };

  useEffect(() => {
    clearHistory();
  }, [datas]);

  // ********** DOCUMENT DATA MANAGEMENT **********

  //___________________________
  // Function called when selecting a new document, inserts new csv data into the "somidata" table.
  const pickDocument = async () => {
    try {
      // #1 : DOCUMENT PICKER
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
      });

      const path = result.assets[0].uri;
      const name = result.assets[0].name;

      // #2 : INSERT FILE PATH INTO "somi"
      db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO somi (filename, filepath, date) values (?, ?, ?)",
          [name, path, date],
          (txObj, resultSet) => {
            console.log(`Successfully added file: ${name}`);
            setFileName(name);
            setFilePath(path);
          },
          (error) => {
            console.error(error);
          }
        );
      });

      // #3 : DELETE existing data in "somidata"
      db.transaction((tx) => {
        tx.executeSql(
          "DELETE FROM somidata",
          (txObj, resultSet) => {
            console.log(
              `Successfully deleted all csv data.`,
              resultSet
            );
          },
          (txObj, error) => console.log(error)
        );
      });

      // #4 : TRANSLATE THE CSV FILE
      if (path) {
        fetch(path)
          .then((response) => response.text())
          .then((csvData) => {
            Papa.parse(csvData, {
              delimiter: "\t",
              quoteChar: '"',
              chunk: function (results) {
                const data = results.data;
                console.log('length:', data.length)

                // #5 : INSERT data into "somidata"
                db.transaction((tx) => {
                  data.forEach((row) => {
                    tx.executeSql(
                      "INSERT INTO somidata (data, date) values (?, ?)",
                      [JSON.stringify(row), date],
                      (txObj, resultSet) => {
                        console.log(`Successfully added csv data: `);
                      },
                      (error) => {
                        console.error(error);
                        reject(error);
                      }
                    );
                  });
                });

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
      console.error("Error picking document:", error);
    }
  };

  // ********** FETCH CSV DATA FROM DATABASE **********

  // #6 : Set the csvData
  const fetchCsvData = async () => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM somidata",
        // "SELECT * FROM somidata WHERE id BETWEEN 2 and 3",
        null,
        (txObj, resultSet) => {
          setCsvData(resultSet.rows._array);
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  useEffect(() => {
    fetchCsvData();
  }, []);

  return (
    <View className="p-2 w-full h-full bg-stone-50">
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
            <Text className="text-2xl font-bold text-zinc-800">
              User Guide:
            </Text>
            <Text className="text-lg mt-5 font-semibold text-zinc-800">
              File Selection:
            </Text>
            <Text className="mt-2 text-zinc-700 text-xs">
              A valid .csv file is required in order to complete a scan cycle on
              this application. To select a file, press the{" "}
              <Text className="italic font-semibold">"Select File"</Text> button
              on the
              <Text className="italic font-semibold">"Settings"</Text> page. A
              .csv file can then be selected from any directory on the device.
              (Moving the file will result in errors / broken file path.)
            </Text>
            <Text className="mt-2 text-zinc-700 text-xs">
              The currently selected file will be displayed under{" "}
              <Text className="italic font-semibold">
                "Currently reading data from file name:"
              </Text>{" "}
              which represents the .csv file being used to find the locations of
              parts based on the part number scanned.
            </Text>

            <Text className="mt-5 text-zinc-700 text-base italic font-medium">
              (Developer email: shane@buidl.co.za)
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
            <Text className="text-sm text-stone-500">{files.date}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
