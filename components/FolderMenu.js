import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { IconButton, Portal, Dialog, Button, Menu } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FOLDER_COLORS = ['#007AFF', '#FF9500', '#FF2D55', '#5856D6', '#34C759'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 300);

export default function FolderMenu({ 
    visible = false, 
    onDismiss = () => {}, 
    folders = [], 
    onFolderSelect = () => {}, 
    selectedFolder = 'all',
    onCreateFolder = () => {},
    onRenameFolder = () => {},
    onDeleteFolder = () => {},
    draggedNote = null,
    folderSort = 'name',
    onChangeFolderSort = () => {},
    onChangeFolderColor = () => {},
}) {
    const [newFolderDialog, setNewFolderDialog] = useState(false);
    const [renameFolderDialog, setRenameFolderDialog] = useState(false);
    const [selectedFolderForAction, setSelectedFolderForAction] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderMenuVisible, setFolderMenuVisible] = useState(false);
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(-MENU_WIDTH));
    const [overlayAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim());
            setNewFolderName('');
            setNewFolderDialog(false);
        }
    };

    const handleRenameFolder = () => {
        if (newFolderName.trim() && selectedFolderForAction) {
            onRenameFolder(selectedFolderForAction.id, newFolderName.trim());
            setNewFolderName('');
            setRenameFolderDialog(false);
            setSelectedFolderForAction(null);
        }
    };

    const handleDeleteFolder = (folder) => {
        Alert.alert(
            "Delete Folder",
            `Are you sure you want to delete "${folder.name}"? Notes will be moved to All Notes.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => onDeleteFolder(folder.id)
                }
            ]
        );
    };

    const handleLongPress = (folder) => {
        setSelectedFolderForAction(folder);
        setFolderMenuVisible(true);
    };

    const sortedFolders = [...folders].sort((a, b) => {
        if (folderSort === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            return new Date(b.lastModified) - new Date(a.lastModified);
        }
    });

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback onPress={onDismiss}>
                <Animated.View 
                    style={[
                        styles.overlay,
                        { opacity: overlayAnim }
                    ]}
                />
            </TouchableWithoutFeedback>

            <Animated.View 
                style={[
                    styles.menu,
                    {
                        transform: [{ translateX: slideAnim }],
                        width: MENU_WIDTH,
                    }
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.headerText}>Folders</Text>
                    <View style={styles.headerButtons}>
                        <IconButton 
                            icon={folderSort === 'name' ? 'sort-alphabetical-ascending' : 'sort-calendar-descending'} 
                            size={24} 
                            onPress={() => onChangeFolderSort(folderSort === 'name' ? 'date' : 'name')}
                        />
                        <IconButton 
                            icon="close" 
                            size={24} 
                            onPress={onDismiss}
                        />
                    </View>
                </View>

                {draggedNote && (
                    <View style={styles.dragIndicator}>
                        <Text style={styles.dragText}>Drop note in a folder</Text>
                    </View>
                )}

                <View style={styles.folderList}>
                    <TouchableOpacity 
                        style={[
                            styles.folderItem,
                            selectedFolder === 'all' && styles.selectedFolder
                        ]}
                        onPress={() => onFolderSelect('all')}
                    >
                        <Icon name="folder-outline" size={24} color="#007AFF" />
                        <Text style={styles.folderText}>All Notes</Text>
                    </TouchableOpacity>

                    {sortedFolders.map((folder) => (
                        <TouchableOpacity 
                            key={folder.id}
                            style={[
                                styles.folderItem,
                                selectedFolder === folder.id && styles.selectedFolder,
                                draggedNote && styles.dropTarget,
                                draggedNote?.folderId === folder.id && styles.currentFolder
                            ]}
                            onPress={() => onFolderSelect(folder.id)}
                            onLongPress={() => handleLongPress(folder)}
                        >
                            <Icon 
                                name={
                                    draggedNote?.folderId === folder.id 
                                        ? "folder-open" 
                                        : draggedNote 
                                            ? "folder-outline" 
                                            : "folder"
                                } 
                                size={24} 
                                color={folder.color || "#007AFF"} 
                            />
                            <Text style={[styles.folderText, { color: folder.color }]}>
                                {folder.name}
                                {draggedNote?.folderId === folder.id && " (Current)"}
                            </Text>
                            <Text style={styles.noteCount}>
                                {folder.noteCount || 0}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {!draggedNote && (
                    <TouchableOpacity 
                        style={styles.createButton}
                        onPress={() => setNewFolderDialog(true)}
                    >
                        <Icon name="folder-plus" size={24} color="#007AFF" />
                        <Text style={styles.createButtonText}>New Folder</Text>
                    </TouchableOpacity>
                )}

                <Menu
                    visible={folderMenuVisible}
                    onDismiss={() => setFolderMenuVisible(false)}
                    anchor={selectedFolderForAction?.id || ''}
                >
                    <Menu.Item 
                        onPress={() => {
                            setFolderMenuVisible(false);
                            setNewFolderName(selectedFolderForAction?.name || '');
                            setRenameFolderDialog(true);
                        }} 
                        title="Rename" 
                        leadingIcon="pencil"
                    />
                    <Menu.Item 
                        onPress={() => {
                            setFolderMenuVisible(false);
                            setColorPickerVisible(true);
                        }} 
                        title="Change Color" 
                        leadingIcon="palette"
                    />
                    <Menu.Item 
                        onPress={() => {
                            setFolderMenuVisible(false);
                            handleDeleteFolder(selectedFolderForAction);
                        }} 
                        title="Delete" 
                        leadingIcon="delete"
                    />
                </Menu>

                <Dialog visible={colorPickerVisible} onDismiss={() => setColorPickerVisible(false)}>
                    <Dialog.Title>Choose Color</Dialog.Title>
                    <Dialog.Content>
                        <View style={styles.colorGrid}>
                            {FOLDER_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[styles.colorOption, { backgroundColor: color }]}
                                    onPress={() => {
                                        onChangeFolderColor(selectedFolderForAction?.id, color);
                                        setColorPickerVisible(false);
                                    }}
                                />
                            ))}
                        </View>
                    </Dialog.Content>
                </Dialog>

                <Dialog 
                    visible={newFolderDialog || renameFolderDialog} 
                    onDismiss={() => {
                        setNewFolderDialog(false);
                        setRenameFolderDialog(false);
                        setNewFolderName('');
                    }}
                >
                    <Dialog.Title>
                        {renameFolderDialog ? 'Rename Folder' : 'Create New Folder'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            value={newFolderName}
                            onChangeText={setNewFolderName}
                            placeholder="Folder name"
                            style={styles.input}
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setNewFolderDialog(false);
                            setRenameFolderDialog(false);
                            setNewFolderName('');
                        }}>Cancel</Button>
                        <Button onPress={renameFolderDialog ? handleRenameFolder : handleCreateFolder}>
                            {renameFolderDialog ? 'Rename' : 'Create'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menu: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    headerText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    folderList: {
        flex: 1,
        paddingTop: 8,
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginHorizontal: 8,
        marginVertical: 4,
    },
    selectedFolder: {
        backgroundColor: '#F0F2F5',
    },
    folderText: {
        fontSize: 16,
        marginLeft: 12,
        flex: 1,
    },
    noteCount: {
        fontSize: 14,
        color: '#6B7280',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginTop: 8,
    },
    createButtonText: {
        fontSize: 16,
        color: '#007AFF',
        marginLeft: 12,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 8,
        fontSize: 16,
    },
    dragIndicator: {
        padding: 16,
        backgroundColor: '#F0F2F5',
        marginBottom: 16,
        alignItems: 'center',
    },
    dragText: {
        fontSize: 14,
        color: '#6B7280',
    },
    dropTarget: {
        backgroundColor: '#F0F2F5',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 10,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        margin: 5,
    },
    currentFolder: {
        backgroundColor: '#E3F2FD',
    },
}); 