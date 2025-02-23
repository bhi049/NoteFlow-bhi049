import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, Alert, StyleSheet, Text, View, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Button, IconButton, Menu } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NoteScreen({ route, navigation }) {
    const stripHtml = (html) => {
        return html.replace(/<[^>]*>?/gm, '');
    };

    const [text, setText] = useState("");
    const [formatMenuVisible, setFormatMenuVisible] = useState(false);
    const [imageMenuVisible, setImageMenuVisible] = useState(false);
    const note = route.params?.note;
    const editorRef = useRef();

    useEffect(() => {
        if (note) setText(note.text);
        requestMediaPermissions();
    }, [note]);

    const requestMediaPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to upload images!');
            }
        }
    };

    // Custom actions for the editor
    const customActions = [
        {
            name: 'checkList',
            iconName: 'checkbox-marked-outline',
            action: () => {
                editorRef.current?.insertHTML(`
                    <div style="display: flex; align-items: center; margin: 8px 0;">
                        <input type="checkbox" style="margin-right: 8px;">
                        <span>New checklist item</span>
                    </div>
                `);
            }
        },
        {
            name: 'bulletList',
            iconName: 'format-list-bulleted',
            action: () => editorRef.current?.sendAction('insertBulletsList', 'bullet')
        },
        {
            name: 'numberList',
            iconName: 'format-list-numbered',
            action: () => editorRef.current?.sendAction('insertOrderedList', 'ordered')
        }
    ];

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                editorRef.current?.insertImage(
                    base64Image,
                    'image',
                    150, // width
                    0, // height (0 maintains aspect ratio)
                    'Image'
                );
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to add image. Please try again.');
        }
    };

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
                const updatedNotes = savedNotes.map(n => (n.id === note.id ? { 
                    ...n, 
                    text,
                    updatedAt: new Date().toISOString(),
                    folderId: note.folderId // Preserve folder ID
                } : n));
                await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
            } else {
                // Add new note
                const newNote = {
                    id: Date.now().toString(),
                    text,
                    title: stripHtml(text).split("\n")[0] || "Untitled",
                    category: 'personal', // default category
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    folderId: null // New notes start without a folder
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

    // Update the RichToolbar component and add custom handlers
    const handleCheckList = () => {
        editorRef.current?.insertHTML(`
            <label style="display: flex; align-items: center; margin: 8px 0;">
                <input type="checkbox" style="margin-right: 8px; width: 16px; height: 16px;">
                <span style="flex: 1;">New checklist item</span>
            </label>
        `);
    };

    const handleBulletList = () => {
        editorRef.current?.sendAction('insertUnorderedList');
    };

    const handleNumberList = () => {
        editorRef.current?.sendAction('insertOrderedList');
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
                actions={[
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.heading1,
                    actions.heading2,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    'checkList',
                    actions.insertImage,
                ]}
                iconMap={{
                    [actions.setBold]: () => (
                        <MaterialCommunityIcons name="format-bold" size={20} color="#666" />
                    ),
                    [actions.setItalic]: () => (
                        <MaterialCommunityIcons name="format-italic" size={20} color="#666" />
                    ),
                    [actions.setUnderline]: () => (
                        <MaterialCommunityIcons name="format-underline" size={20} color="#666" />
                    ),
                    [actions.heading1]: () => (
                        <MaterialCommunityIcons name="format-header-1" size={20} color="#666" />
                    ),
                    [actions.heading2]: () => (
                        <MaterialCommunityIcons name="format-header-2" size={20} color="#666" />
                    ),
                    [actions.insertBulletsList]: () => (
                        <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#666" />
                    ),
                    [actions.insertOrderedList]: () => (
                        <MaterialCommunityIcons name="format-list-numbered" size={20} color="#666" />
                    ),
                    checkList: () => (
                        <MaterialCommunityIcons name="checkbox-marked-outline" size={20} color="#666" />
                    ),
                    insertImage: () => (
                        <MaterialCommunityIcons name="image-plus" size={20} color="#666" />
                    ),
                }}
                onPressAddImage={pickImage}
                onInsertLink={() => {
                    // Handle link insertion if needed
                }}
                style={styles.toolbar}
                selectedIconTint="#007AFF"
                disabledIconTint="#BDBDBD"
                iconSize={20}
                onCheckList={handleCheckList}
                onInsertBulletsList={handleBulletList}
                onInsertOrderedList={handleNumberList}
            />

            {/* Rich Editor */}
            <ScrollView style={styles.editorContainer}>
                <RichEditor
                    ref={editorRef}
                    initialContentHTML={text}
                    onChange={setText}
                    placeholder="Start writing..."
                    style={styles.editor}
                    initialHeight={400}
                    useContainer={false}
                    editorInitializedCallback={() => {
                        console.log('Editor is ready');
                    }}
                    editorStyle={{
                        backgroundColor: '#FFFFFF',
                        contentCSSText: `
                            font-family: -apple-system, system-ui;
                            font-size: 16px;
                            padding: 16px;
                            min-height: 200px;
                        `,
                    }}
                    pasteAsPlainText={true}
                    placeholder="Start writing..."
                    initialFocus={false}
                    disabled={false}
                    scrollEnabled={true}
                    containerStyle={styles.editorContainer}
                    onPaste={(data) => {
                        console.log('Pasted:', data);
                    }}
                    onKeyUp={() => {
                        // Handle key up events if needed
                    }}
                    onInput={(data) => {
                        // Handle input events if needed
                    }}
                />
            </ScrollView>
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
        flex: 1, 
        textAlign: "center",
    },
    saveButtonText: {
        fontSize: 16,
        color: "#007AFF", 
    },
    editorContainer: {
        flex: 1,
        minHeight: 400,
        backgroundColor: '#FFFFFF',
    },
    editor: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        minHeight: 200,
    },
    toolbar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8,
        height: 48,
    },
});