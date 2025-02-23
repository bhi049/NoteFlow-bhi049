import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View, Image, ScrollView, Alert } from "react-native"; 
import { FAB, Chip, IconButton, Menu, Portal, Provider } from "react-native-paper"; 
import logo from "../assets/NoteFlow-logo-l.png";
import FolderMenu from '../components/FolderMenu';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
    useAnimatedGestureHandler,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDeleteNote = async (noteId) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updatedNotes = notes.filter(note => note.id !== noteId);
                            await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
                            setNotes(updatedNotes);
                            setMenuVisible(false);
                        } catch (error) {
                            console.error("Error deleting note:", error);
                        }
                    }
                }
            ]
        );
    };

    const renderNote = ({ item }) => {
        const title = stripHtml(item.text).split("\n")[0] || "Untitled";
        const preview = stripHtml(item.text).split("\n").slice(1).join("\n").substring(0, 100);
        const folder = folders.find(f => f.id === item.folderId);

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
                            <View style={styles.noteContent}>
                                <View style={styles.noteHeader}>
                                    <Text style={styles.noteTitle} numberOfLines={1}>
                                        {title}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={(event) => {
                                            const { pageX, pageY } = event.nativeEvent;
                                            setMenuPosition({
                                                x: pageX - 20,
                                                y: pageY + 20
                                            });
                                            setSelectedNote(item);
                                            setMenuVisible(true);
                                        }}
                                        style={styles.menuButton}
                                    >
                                        <MaterialCommunityIcons 
                                            name="dots-vertical" 
                                            size={20} 
                                            color="#6B7280" 
                                        />
                                    </TouchableOpacity>
                                </View>

                                {preview && (
                                    <Text style={styles.notePreview} numberOfLines={2}>
                                        {preview}
                                    </Text>
                                )}

                                <View style={styles.noteFooter}>
                                    {item.category !== 'all' && (
                                        <View style={styles.tagContainer}>
                                            <MaterialCommunityIcons name="tag" size={14} color="#6B7280" />
                                            <Text style={styles.tagText}>
                                                {item.category}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    {folder && (
                                        <View style={styles.folderIndicator}>
                                            <MaterialCommunityIcons 
                                                name="folder" 
                                                size={14} 
                                                color={folder.color || "#007AFF"} 
                                            />
                                            <Text style={[
                                                styles.folderText,
                                                { color: folder.color || "#007AFF" }
                                            ]}>
                                                {folder.name}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>
        );
    };

    return (
        <Provider>
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <IconButton
                        icon="menu"
                        size={24}
                        onPress={() => setFolderMenuVisible(true)}
                        style={styles.menuButton}
                        color="#1C1C1E"
                    />
                    <View style={styles.logoContainer}>
                        <Image source={logo} style={styles.logo}/>
                    </View>
                    <View style={styles.headerRight} />
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

                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search notes..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchBar}
                        placeholderTextColor="#6B7280"
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>

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

                <Menu
                    visible={menuVisible}
                    onDismiss={() => {
                        setMenuVisible(false);
                        setSelectedNote(null);
                    }}
                    anchor={menuPosition}
                >
                    <Menu.Item 
                        onPress={() => {
                            setMenuVisible(false);
                            navigation.navigate("Note", { note: selectedNote });
                        }} 
                        title="Edit"
                        leadingIcon="pencil"
                    />
                    <Menu.Item 
                        onPress={() => handleDeleteNote(selectedNote?.id)} 
                        title="Delete"
                        leadingIcon="delete"
                        titleStyle={{ color: '#FF3B30' }}
                    />
                </Menu>
            </SafeAreaView>
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 130,
        height: 40,
        resizeMode: 'contain',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    searchIcon: {
        marginRight: 12,
        color: '#8E8E93',
    },
    searchBar: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
        padding: 0,
    },
    categoryContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    categoryChip: {
        marginRight: 8,
        borderRadius: 20,
        height: 38,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
    },
    selectedCategoryChip: {
        backgroundColor: '#007AFF',
        borderWidth: 0,
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    categoryChipText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#6B7280',
    },
    noteContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    noteContent: {
        flex: 1,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: '#1C1C1E',
        flex: 1,
        marginRight: 12,
        letterSpacing: -0.5,
    },
    noteDate: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
    },
    notePreview: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 12,
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        flexWrap: 'wrap',
        gap: 8,
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    folderIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#F0F7FF',
    },
    folderText: {
        fontSize: 13,
        marginLeft: 6,
        fontWeight: '500',
    },
    fab: {
        position: "absolute",
        backgroundColor: '#007AFF',
        bottom: 32,
        right: 24,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 8,
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
        marginLeft: 4,
    },
    headerRight: {
        width: 40,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#8E8E93",
        lineHeight: 24,
        paddingHorizontal: 32,
    },
    draggedNote: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
});
