import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View } from "react-native"; 
import { FAB } from "react-native-paper"; 

export default function HomeScreen({ navigation }) {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Load notes when the screen is focused
        const unsubscribe = navigation.addListener("focus", loadNotes);
        return unsubscribe;
    }, [navigation]);

    const loadNotes = async () => {
        try {
            const savedNotes = await AsyncStorage.getItem("notes");
            setNotes(savedNotes ? JSON.parse(savedNotes) : []);
        } catch (error) {
            console.error("Error loading notes:", error);
        }
    };

    const searchFilter = notes.filter((note) => 
        note.text.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.mainHeader}>My Notes</Text>
            </View>

            <TextInput
                placeholder="Search Notes..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchBar}
            />

            {notes.length === 0 ? (
                <Text style={styles.emptyText}>No notes available. Click + to add one.</Text>
            ) : (
                <FlatList
                    data={searchFilter}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate("Note", { note: item })}>
                            <View style={styles.noteContainer}>
                                <Text style={styles.noteHeader}>
                                    {item.text.split("\n")[0]} {/* First line as header */}
                                </Text>
                                <Text style={styles.notePreview}>
                                    {item.text.substring(0, 50)}... {/* Show first 50 characters */}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            <FAB 
                icon="plus" 
                style={styles.fab} 
                onPress={() => navigation.navigate("Note")} 
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
        marginBottom: 20,
    },
    mainHeader: {
        fontSize: 36, 
        fontWeight: "bold",
        color: "#333",
    },
    searchBar: {
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginBottom: 10,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        color: "#777",
    },
    noteContainer: {
        padding: 15,
        backgroundColor: "#f5f5f5",
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    noteHeader: {
        fontSize: 20, 
        fontWeight: "bold",
        color: "#444",
        marginBottom: 5,
    },
    notePreview: {
        fontSize: 14,
        color: "#777",
    },
    fab: {
        position: "absolute",
        backgroundColor: "#C0C0C0",
        bottom: 20,
        right: 20,
    },
});
