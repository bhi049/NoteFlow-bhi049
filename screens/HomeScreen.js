import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { FlatList, TextInput, View, TouchableOpacity, StyleSheet, Text } from "react-native"; 
import { FAB, List } from "react-native-paper"; 

export default function HomeScreen({ navigation }) {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Load notes when the screen is focused
        const unsubscribe = navigation.addListener("focus", loadNotes);
        return unsubscribe; // ✅ Ensure cleanup
    }, [navigation]);

    const loadNotes = async () => {
        try {
            const savedNotes = await AsyncStorage.getItem("notes");
            if (savedNotes) {
                setNotes(JSON.parse(savedNotes));
            } else {
                setNotes([]); // Set to empty if no notes exist
            }
        } catch (error) {
            console.error("Error loading notes:", error);
        }
    };

    const searchFilter = notes.filter((note) => 
        note.text.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Notes</Text>

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
                            <List.Item title={item.text} description={item.date} />
                        </TouchableOpacity>
                    )}
                />
            )}

            <FAB 
                icon="plus" 
                style={styles.fab} 
                onPress={() => navigation.navigate("Note")} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
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
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
    },
});
