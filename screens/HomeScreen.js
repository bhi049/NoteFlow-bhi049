import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { FlatList, TextInput, View, TouchableOpacity } from "react-native"; 
import { FAB, List } from "react-native-paper"; // ✅ Import FAB and List from Paper

export default function HomeScreen({ navigation }) {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        const savedNotes = await AsyncStorage.getItem('notes');
        if (savedNotes) setNotes(JSON.parse(savedNotes));
    };

    const searchFilter = notes.filter(note => 
        note.text.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <TextInput
                label="Search Notes"
                value={search}
                onChangeText={setSearch}
                style={{ marginBottom: 10 }}
            />
            <FlatList
                data={searchFilter}
                keyExtractor={item => item.id} 
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => navigation.navigate('Note', { note: item })}>
                        <List.Item title={item.text} description={item.date} /> 
                    </TouchableOpacity>
                )}
            />
            <FAB 
                icon="plus" 
                style={{ position: 'absolute', bottom: 20, right: 20 }} 
                onPress={() => navigation.navigate('Note')} 
            />
        </View>
    );
}
