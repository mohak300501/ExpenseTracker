import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { getSetting, setSetting, clearAllData, getAllTransactions } from '../database/db';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

export default function SettingsScreen() {
    const [time, setTime] = useState('21:00');
    const [dbSize, setDbSize] = useState('0 KB');

    useFocusEffect(
        useCallback(() => {
            getSetting('notification_time').then(val => {
                if (val) setTime(val);
            });
            checkDbSize();
        }, [])
    );

    const checkDbSize = async () => {
        try {
            const dbDir = `${FileSystem.documentDirectory}SQLite/expenses.db`;
            const info = await FileSystem.getInfoAsync(dbDir);
            if (info.exists) {
                setDbSize((info.size / 1024).toFixed(2) + ' KB');
            }
        } catch (e) {
            console.log(e);
        }
    };

    const handleSaveTime = async () => {
        await setSetting('notification_time', time);
        Alert.alert('Saved', 'Notification time updated.');
    };

    const handleExport = async (type: 'daily' | 'monthly' | 'yearly') => {
        const txs = await getAllTransactions();
        let content = `Expense Tracker Export (${type})\n\n`;

        const grouped: { [key: string]: number } = {};
        txs.forEach(tx => {
            const dateObj = new Date(tx.date);
            let key = '';
            if (type === 'daily') key = format(dateObj, 'yyyy-MM-dd');
            if (type === 'monthly') key = format(dateObj, 'yyyy-MM');
            if (type === 'yearly') key = format(dateObj, 'yyyy');
            grouped[key] = (grouped[key] || 0) + (tx.type === 'CREDIT' ? tx.amount : -tx.amount);
        });

        Object.keys(grouped).forEach(k => {
            content += `${k}: Rs. ${grouped[k].toFixed(2)}\n`;
        });

        const fileUri = FileSystem.documentDirectory + `export_${type}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert('Error', 'Sharing is not available on this device');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete all transaction data? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                    await clearAllData();
                    Alert.alert('Deleted', 'All transactions have been deleted.');
                    checkDbSize();
                }}
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Notification Time" />
                <Card.Content>
                    <TextInput
                        label="Time (HH:MM)"
                        value={time}
                        onChangeText={setTime}
                        mode="outlined"
                        placeholder="21:00"
                    />
                    <Button mode="contained" onPress={handleSaveTime} style={{marginTop: 10}}>
                        Save Time
                    </Button>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Export Data" />
                <Card.Content>
                    <View style={styles.row}>
                        <Button mode="outlined" onPress={() => handleExport('daily')}>Daily</Button>
                        <Button mode="outlined" onPress={() => handleExport('monthly')}>Monthly</Button>
                        <Button mode="outlined" onPress={() => handleExport('yearly')}>Yearly</Button>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Data Management" />
                <Card.Content>
                    <Text>Database Size: {dbSize}</Text>
                    <Button mode="contained" buttonColor="red" onPress={handleDelete} style={{marginTop: 10}}>
                        Delete All Data
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }
});
