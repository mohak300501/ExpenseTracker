import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../utils/AppContext';
import { getDistinctBanks } from '../database/db';
import { format } from 'date-fns';

export default function FilterBar() {
    const { selectedBank, setSelectedBank, startDate, setStartDate, endDate, setEndDate } = useContext(AppContext);
    
    const [bankMenuVisible, setBankMenuVisible] = useState(false);
    const [availableBanks, setAvailableBanks] = useState<string[]>([]);

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        getDistinctBanks().then(banks => {
            setAvailableBanks(['All', ...banks]);
        });
    }, []);

    const openBankMenu = () => setBankMenuVisible(true);
    const closeBankMenu = () => setBankMenuVisible(false);

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Menu
                    visible={bankMenuVisible}
                    onDismiss={closeBankMenu}
                    anchor={<Button mode="outlined" onPress={openBankMenu}>{selectedBank.length > 15 ? selectedBank.substring(0, 15) + '...' : selectedBank}</Button>}
                >
                    {availableBanks.map(bank => (
                        <Menu.Item 
                            key={bank} 
                            onPress={() => { setSelectedBank(bank); closeBankMenu(); }} 
                            title={bank} 
                        />
                    ))}
                </Menu>

                <View style={styles.dateGroup}>
                    <Button 
                        mode={startDate ? "contained-tonal" : "text"}
                        onPress={() => setShowStartPicker(true)}
                        compact
                    >
                        {startDate ? format(startDate, 'dd MMM') : 'Start Date'}
                    </Button>
                    <Text style={styles.dash}>-</Text>
                    <Button 
                        mode={endDate ? "contained-tonal" : "text"}
                        onPress={() => setShowEndPicker(true)}
                        compact
                    >
                        {endDate ? format(endDate, 'dd MMM') : 'End Date'}
                    </Button>
                </View>
            </View>

            {/* Clear Filters */}
            {(selectedBank !== 'All' || startDate || endDate) && (
                <Button 
                    mode="text" 
                    textColor="red" 
                    onPress={() => {
                        setSelectedBank('All');
                        setStartDate(null);
                        setEndDate(null);
                    }}
                >
                    Clear Filters
                </Button>
            )}

            {showStartPicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowStartPicker(false);
                        if (date) setStartDate(date);
                    }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={startDate || undefined}
                    onChange={(event, date) => {
                        setShowEndPicker(false);
                        if (date) setEndDate(date);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: 'transparent',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dash: {
        marginHorizontal: 4,
    }
});
