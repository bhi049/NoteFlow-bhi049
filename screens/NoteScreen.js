import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NoteScreen({ route, navigation }) {
  const [text, setText] = useState('');
  const note = route.params?.note;

  useEffect(() => {
    if (note) setText(note.text);
  }, [note]);

  const saveNote = async () => {
    const savedNotes = JSON.parse(await AsyncStorage.getItem('notes')) || [];
    if (note) {
      const updatedNotes = savedNotes.map(n => (n.id === note.id ? { ...n, text } : n));
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
    } else {
      const newNote = { id: Date.now().toString(), text, date: new Date().toLocaleString() };
      await AsyncStorage.setItem('notes', JSON.stringify([...savedNotes, newNote]));
    }
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        label="Write your note"
        value={text}
        onChangeText={setText}
        multiline
        style={{ height: 200 }}
      />
      <Button mode="contained" onPress={saveNote} style={{ marginTop: 20 }}>
        Save Note
      </Button>
    </View>
  );
}
