import React, { useState, useCallback, useContext } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Switch } from 'react-native-paper';
import { getSetting, setSetting, clearAllData, getAllTransactions } from '../database/db';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { format, endOfMonth, endOfYear, isSameDay, isSameMonth, isSameYear, addDays } from 'date-fns';
import { AppContext } from '../utils/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
    const { theme, setTheme } = useContext(AppContext);
    const [time, setTime] = useState('21:00');
    const [dbSize, setDbSize] = useState('0 KB');

    // Export States
    const [exportStart, setExportStart] = useState<Date>(new Date());
    const [exportEnd, setExportEnd] = useState<Date>(new Date());
    const [showExportStartPicker, setShowExportStartPicker] = useState(false);
    const [showExportEndPicker, setShowExportEndPicker] = useState(false);

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
        await setSetting('last_notified_date', '0'); // Reset so it triggers today
        Alert.alert('Saved', 'Notification time updated. It will trigger at the new time today.');
    };

    const handleExport = async () => {
        if (exportEnd < exportStart) {
            Alert.alert("Error", "End date must be after Start date");
            return;
        }

        const txs = await getAllTransactions();
        let content = `Expense Tracker Export Summary\nFrom: ${format(exportStart, 'dd MMM yyyy')} To: ${format(exportEnd, 'dd MMM yyyy')}\n\n`;

        // Create a map of day -> { credits, debits }
        const dayMap: Record<string, { c: number, d: number }> = {};
        
        txs.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate >= exportStart && txDate <= exportEnd) {
                const dayKey = format(txDate, 'yyyy-MM-dd');
                if (!dayMap[dayKey]) dayMap[dayKey] = { c: 0, d: 0 };
                if (tx.type === 'CREDIT') dayMap[dayKey].c += tx.amount;
                else dayMap[dayKey].d += tx.amount;
            }
        });

        let currentDay = exportStart;
        let monthCredits = 0;
        let monthDebits = 0;
        let yearCredits = 0;
        let yearDebits = 0;

        while (currentDay <= exportEnd) {
            const dayKey = format(currentDay, 'yyyy-MM-dd');
            if (dayMap[dayKey]) {
                const { c, d } = dayMap[dayKey];
                content += `${dayKey}:\t+ Rs.${c.toFixed(2)}\t- Rs.${d.toFixed(2)}\n`;
                monthCredits += c;
                monthDebits += d;
                yearCredits += c;
                yearDebits += d;
            } else {
                content += `${dayKey}:\t+ Rs.0.00\t- Rs.0.00\n`;
            }

            // Month end summary
            if (currentDay.getTime() === endOfMonth(currentDay).getTime() || isSameDay(currentDay, exportEnd)) {
                content += `\n--- ${format(currentDay, 'MMMM yyyy')} Summary ---\n`;
                content += `Total Credits: + Rs.${monthCredits.toFixed(2)}\n`;
                content += `Total Debits: - Rs.${monthDebits.toFixed(2)}\n\n`;
                monthCredits = 0;
                monthDebits = 0;
            }

            // Year end summary
            if (currentDay.getTime() === endOfYear(currentDay).getTime() || isSameDay(currentDay, exportEnd)) {
                // If it was just printed by month end, avoid double printing unless it's exactly Dec 31
                content += `\n=== ${format(currentDay, 'yyyy')} Summary ===\n`;
                content += `Total Credits: + Rs.${yearCredits.toFixed(2)}\n`;
                content += `Total Debits: - Rs.${yearDebits.toFixed(2)}\n====================\n\n`;
                yearCredits = 0;
                yearDebits = 0;
            }

            currentDay = addDays(currentDay, 1);
        }

        const fileUri = FileSystem.documentDirectory + `export_custom.txt`;
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert('Error', 'Sharing is not available');
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
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Appearance" />
                <Card.Content style={styles.row}>
                    <Text variant="bodyLarge">Dark Mode</Text>
                    <Switch value={theme === 'dark'} onValueChange={(val) => setTheme(val ? 'dark' : 'light')} />
                </Card.Content>
            </Card>

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
                    <Text variant="bodyMedium" style={{marginBottom: 10}}>Select Date Range to Export</Text>
                    <View style={styles.row}>
                        <Button mode="outlined" onPress={() => setShowExportStartPicker(true)}>
                            {format(exportStart, 'dd MMM yyyy')}
                        </Button>
                        <Text>to</Text>
                        <Button mode="outlined" onPress={() => setShowExportEndPicker(true)}>
                            {format(exportEnd, 'dd MMM yyyy')}
                        </Button>
                    </View>
                    <Button mode="contained" onPress={handleExport} style={{marginTop: 15}}>
                        Export to File
                    </Button>
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

            {showExportStartPicker && (
                <DateTimePicker 
                    value={exportStart} 
                    onChange={(_, d) => { setShowExportStartPicker(false); if (d) setExportStart(d); }} 
                />
            )}
            {showExportEndPicker && (
                <DateTimePicker 
                    value={exportEnd} 
                    minimumDate={exportStart} 
                    onChange={(_, d) => { setShowExportEndPicker(false); if (d) setExportEnd(d); }} 
                />
            )}
            <View style={{height: 40}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }
});
