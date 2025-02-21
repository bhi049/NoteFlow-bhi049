import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View, Image, ScrollView } from "react-native"; 
import { FAB, Chip, IconButton } from "react-native-paper"; 
import logo from "../assets/NoteFlow-logo-l.png";
import FolderMenu from '../components/FolderMenu';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
    useAnimatedGestureHandler,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

export default function HomeScreen({ navigation }) {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [folderMenuVisible, setFolderMenuVisible] = useState(false);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [draggedNote, setDraggedNote] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [folderSort, setFolderSort] = useState('name');

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            console.log("Loading notes...");
            loadNotes();
        });
        return unsubscribe;
    }, [navigation]);
    
    useEffect(() => {
        loadFolders();
    }, []);

    const loadNotes = async () => {
        try {
            const savedNotes = await AsyncStorage.getItem("notes");
            const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
            
            // Ensure parsedNotes is always an array
            if (!Array.isArray(parsedNotes)) {
                setNotes([]);
            } else {
                setNotes(parsedNotes);
            }
        } catch (error) {
            console.error("Error loading notes:", error);
            setNotes([]); // Fallback to an empty array in case of an error
        }
    };

    const loadFolders = async () => {
        try {
            const savedFolders = await AsyncStorage.getItem("folders");
            if (!savedFolders) {
                setFolders([]);
                return;
            }
            
            const parsedFolders = JSON.parse(savedFolders);
            if (!Array.isArray(parsedFolders)) {
                console.error("Corrupt folders data found in AsyncStorage. Resetting folders.");
                setFolders([]);
                await AsyncStorage.setItem("folders", JSON.stringify([]));
                return;
            }
            
            setFolders(parsedFolders);
        } catch (error) {
            console.error("Error loading folders:", error);
            setFolders([]);
        }
    };

    const createFolder = async (name) => {
        try {
            const newFolder = {
                id: Date.now().toString(),
                name,
                noteCount: 0,
                color: '#007AFF',
                lastModified: new Date().toISOString()
            };
            
            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            await AsyncStorage.setItem("folders", JSON.stringify(updatedFolders));
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const renameFolder = async (folderId, newName) => {
        try {
            const updatedFolders = folders.map(folder => 
                folder.id === folderId 
                    ? { 
                        ...folder, 
                        name: newName,
                        lastModified: new Date().toISOString()
                    } 
                    : folder
            );
            setFolders(updatedFolders);
            await AsyncStorage.setItem("folders", JSON.stringify(updatedFolders));
        } catch (error) {
            console.error("Error renaming folder:", error);
        }
    };

    const deleteFolder = async (folderId) => {
        try {
            // Move all notes from this folder back to "All Notes"
            const updatedNotes = notes.map(note => 
                note.folderId === folderId ? { ...note, folderId: null } : note
            );
            setNotes(updatedNotes);
            await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));

            // Remove the folder
            const updatedFolders = folders.filter(folder => folder.id !== folderId);
            setFolders(updatedFolders);
            await AsyncStorage.setItem("folders", JSON.stringify(updatedFolders));

            // If the deleted folder was selected, switch to "All Notes"
            if (selectedFolder === folderId) {
                setSelectedFolder('all');
            }
        } catch (error) {
            console.error("Error deleting folder:", error);
        }
    };

    const changeFolderColor = async (folderId, color) => {
        try {
            const updatedFolders = folders.map(folder => 
                folder.id === folderId 
                    ? { 
                        ...folder, 
                        color,
                        lastModified: new Date().toISOString()
                    } 
                    : folder
            );
            setFolders(updatedFolders);
            await AsyncStorage.setItem("folders", JSON.stringify(updatedFolders));
        } catch (error) {
            console.error("Error changing folder color:", error);
        }
    };

    const moveNoteToFolder = async (noteId, folderId) => {
        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, folderId } : note
        );
        setNotes(updatedNotes);
        await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
        
        // Update folder note counts
        const updatedFolders = folders.map(folder => ({
            ...folder,
            noteCount: updatedNotes.filter(note => note.folderId === folder.id).length
        }));
        setFolders(updatedFolders);
        await AsyncStorage.setItem("folders", JSON.stringify(updatedFolders));
    };

    // Function to strip HTML tags from note text
    const stripHtml = (html) => {
        return html.replace(/<[^>]*>?/gm, '') // Removes all HTML tags
    }

    const searchFilter = Array.isArray(notes) ? notes.filter((note) => 
        note.text.toLowerCase().includes(search.toLowerCase())
    ) : [];
    
    const categories = ['all', 'personal', 'work', 'ideas', 'tasks'];
    
    const filteredNotes = searchFilter.filter(note => 
        (selectedFolder === 'all' || note.folderId === selectedFolder) &&
        (selectedCategory === 'all' || note.category === selectedCategory)
    );

    const sortNotes = (notesToSort) => {
        switch (sortBy) {
            case 'newest':
                return [...notesToSort].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            case 'oldest':
                return [...notesToSort].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
            case 'title':
                return [...notesToSort].sort((a, b) => a.title.localeCompare(b.title));
            default:
                return notesToSort;
        }
    };

    const CategoryList = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryContainer}
        >
            {categories.map(category => (
                <Chip
                    key={category}
                    selected={selectedCategory === category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                        styles.categoryChip,
                        selectedCategory === category && styles.selectedCategoryChip
                    ]}
                    textStyle={[
                        styles.categoryChipText,
                        selectedCategory === category && { color: '#FFFFFF' }
                    ]}
                >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                </Chip>
            ))}
        </ScrollView>
    );

    const handleGesture = (event, note) => {
        const { translationX } = event.nativeEvent;
        
        if (translationX > 50) {
            setDraggedNote(note);
            setFolderMenuVisible(true);
        }
    };

    const handleNoteDrop = (folderId) => {
        if (draggedNote) {
            moveNoteToFolder(draggedNote.id, folderId);
            setDraggedNote(null);
        }
        setSelectedFolder(folderId);
        setFolderMenuVisible(false);
    };

    const handleFolderSelect = (folderId) => {
        setSelectedFolder(folderId);
        setFolderMenuVisible(false);
    };

    const handleNoteLongPress = (note) => {
        setDraggedNote(note);
        setFolderMenuVisible(true);
    };

    const renderNote = ({ item }) => {
        return (
            <PanGestureHandler
                onGestureEvent={(event) => handleGesture(event, item)}
                activeOffsetX={[-20, 50]}
                failOffsetY={[-20, 20]}
            >
                <Animated.View>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate("Note", { note: item })}
                        onLongPress={() => handleNoteLongPress(item)}
                        activeOpacity={0.7}
                        delayLongPress={300}
                    >
                        <View style={[
                            styles.noteContainer,
                            item.id === draggedNote?.id && styles.draggedNote
                        ]}>
                            <Text style={styles.noteHeader} numberOfLines={1}>
                                {stripHtml(item.text).split("\n")[0] || "Untitled"}
                            </Text>
                            <Text style={styles.notePreview} numberOfLines={2}>
                                {stripHtml(item.text).split("\n").slice(1).join("\n").substring(0, 100)}
                            </Text>
                            {item.folderId && (
                                <Text style={styles.folderIndicator}>
                                    {folders.find(f => f.id === item.folderId)?.name || 'Unfiled'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <IconButton
                    icon="menu"
                    size={24}
                    onPress={() => setFolderMenuVisible(true)}
                    style={styles.menuButton}
                />
                <Image source={logo} style={styles.logo}/>
            </View>

            <FolderMenu
                visible={folderMenuVisible}
                onDismiss={() => {
                    setFolderMenuVisible(false);
                    setDraggedNote(null);
                }}
                folders={folders || []}
                selectedFolder={selectedFolder}
                onFolderSelect={draggedNote ? handleNoteDrop : handleFolderSelect}
                onCreateFolder={createFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
                onChangeFolderColor={changeFolderColor}
                draggedNote={draggedNote}
                folderSort={folderSort}
                onChangeFolderSort={setFolderSort}
            />

            <TextInput
                placeholder="Search notes..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchBar}
                placeholderTextColor="#6B7280"
                returnKeyType="search"
                clearButtonMode="while-editing"
            />

            <CategoryList />

            {notes.length === 0 ? (
                <Text style={styles.emptyText}>No notes available. Click + to add one.</Text>
            ) : (
                <FlatList
                    data={sortNotes(filteredNotes)}
                    renderItem={renderNote}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    showsVerticalScrollIndicator={false}
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
        padding: 16,
        backgroundColor: "#FFFFFF",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        paddingTop: 8,
        position: 'relative',
    },
    logo: {
        width: 120,
        height: 60,
        resizeMode: 'contain',
    },
    searchBar: {
        padding: 12,
        backgroundColor: '#F5F7F9',
        borderRadius: 12,
        marginBottom: 16,
        height: 46,
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 0,
    },
    categoryContainer: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    categoryChip: {
        marginRight: 8,
        borderRadius: 20,
        height: 36,
        backgroundColor: '#F0F2F5',
    },
    selectedCategoryChip: {
        backgroundColor: '#007AFF',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    noteContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    noteHeader: {
        fontSize: 18,
        fontWeight: "600",
        color: '#1C1C1E',
        marginBottom: 6,
    },
    notePreview: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#6B7280",
        lineHeight: 24,
    },
    fab: {
        position: "absolute",
        backgroundColor: '#007AFF',
        bottom: 24,
        right: 24,
        borderRadius: 30,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuButton: {
        position: 'absolute',
        left: 0,
    },
    draggedNote: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    folderIndicator: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
    },
});
