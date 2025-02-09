import React, { useState, useEffect } from "react";
import { SafeAreaView, Alert, StyleSheet, Text, View } from "react-native";
import { Button, TextInput, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NoteScreen({ route, navigation }) {
    const [text, setText] = useState("");
    const note = route.params?.note;

    useEffect(() => {
        if (note) setText(note.text);
    }, [note]);

    const saveNote = async () => {
        const savedNotes = JSON.parse(await AsyncStorage.getItem("notes")) || [];

        if (note) {
            // Update existing note
            const updatedNotes = savedNotes.map(n => (n.id === note.id ? { ...n, text } : n));
            await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
        } else {
            // Add new note
            const newNote = {
                id: Date.now().toString(),
                text,
                date: new Date().toLocaleString(),
            };
            await AsyncStorage.setItem("notes", JSON.stringify([...savedNotes, newNote]));
        }
        navigation.goBack();
    };

    const deleteNote = async () => {
        if (!note) {
            navigation.goBack();
            return;
        }

        Alert.alert("Delete Note?", "Are you sure you want to delete this note?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", onPress: async () => {
                const savedNotes = JSON.parse(await AsyncStorage.getItem("notes")) || [];
                const updatedNotes = savedNotes.filter(n => n.id !== note.id);
                await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
                navigation.goBack();
            }},
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.noteHeader}>{text.split("\n")[0] || "New Note"}</Text>
                <IconButton icon="delete" color="#C0C0C0" size={26} onPress={deleteNote} />
            </View>

            <TextInput
                label="Write your note..."
                value={text}
                onChangeText={setText}
                multiline
                mode="outlined"
                style={styles.textInput}
            />

            <Button mode="contained" onPress={saveNote} style={styles.saveButton}>
                Save Note
            </Button>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#FFFFFF", 
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    noteHeader: {
        fontSize: 30, 
        fontWeight: "bold",
        color: "#333",
        flex: 1,
    },
    textInput: {
        height: 200,
        fontSize: 18,
        marginBottom: 20,
    },
    saveButton: {
        marginTop: 10,
        backgroundColor: "#C0C0C0",
    },
});
