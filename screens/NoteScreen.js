import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, Alert, StyleSheet, Text, View } from "react-native";
import { Button, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RichEditor, RichToolbar } from "react-native-pell-rich-editor";


export default function NoteScreen({ route, navigation }) {
    const [text, setText] = useState("");
    const note = route.params?.note;
    let editorRef = useRef(); // Ref for the RichEditor

    useEffect(() => {
        if (note) setText(note.text);
    }, [note]);

    const saveNote = async () => {

        try {
            const savedNotes = JSON.parse(await AsyncStorage.getItem("notes")) || [];

            if (!Array.isArray(savedNotes)) {
                console.error("Corrupt data found in AsyncStorage. Resetting notes.");
                await AsyncStorage.setItem("notes", JSON.stringify([]));
                return;
            }

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

            console.log("Note saved successfully!");
            navigation.goBack();
        } catch (error) {
            console.error("Error saving note:", error);
        }
    };


    const deleteNote = async () => {
        if (!note) {
            navigation.goBack();
            return;
        }

        Alert.alert("Delete Note?", "Are you sure you want to delete this note?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", onPress: async () => {
                    const savedNotes = JSON.parse(await AsyncStorage.getItem("notes")) || [];
                    const updatedNotes = savedNotes.filter(n => n.id !== note.id);
                    await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
                    navigation.goBack();
                }
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
                {/* Back Button (Top Left) */}
                <IconButton
                    icon="arrow-left"
                    color="#C0C0C0"
                    size={26}
                    onPress={() => navigation.goBack()}
                />

                {/* Title */}
                <Text style={styles.noteHeader}>{text ? "Editing Note" : "New Note"}</Text>

                {/* Save Button (Top Right) */}
                <Button
                    mode="text"
                    onPress={saveNote}
                    labelStyle={styles.saveButtonText}
                >
                    Save
                </Button>
            </View>

            {/* Rich Text Toolbar */}
            <RichToolbar
                editor={editorRef}
                actions={["bold", "italic", "underline", "unorderedList", "orderedList", "link", "image"]}
                selectedIconTint="#C0C0C0"
                style={styles.toolbar}
            />

            {/* Rich Editor */}
            <RichEditor
                ref={editorRef}
                initialContentHTML={text}
                onChange={(html) => setText(html)}
                placeholder="Write your note..."
                style={styles.editor}
            />
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
        alignItems: "center",
        justifyContent: "space-between", // Space out Back Button, Title, and Save Button
        marginBottom: 10,
    },
    noteHeader: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        flex: 1, // Allow the title to expand
        textAlign: "center",
    },
    saveButtonText: {
        fontSize: 16,
        color: "#007AFF", // iOS-style save button color
    },
    editor: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        minHeight: 200,
    },
    toolbar: {
        backgroundColor: "#f5f5f5",
        borderTopWidth: 1,
        borderTopColor: "#ccc",
    },
});