import React, { useCallback, useState, useContext, useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { getAllTransactions, Transaction } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../utils/AppContext';
import FilterBar from '../components/FilterBar';

export default function TransactionsScreen() {
    const theme = useTheme();
    const { selectedBank, startDate, endDate } = useContext(AppContext);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useFocusEffect(
        useCallback(() => {
            getAllTransactions().then(setTransactions);
        }, [])
    );

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (selectedBank !== 'All' && `${t.bank_name} (${t.account_number})` !== selectedBank) return false;
            const txDate = new Date(t.date);
            if (startDate && txDate < startDate) return false;
            // set end date to end of the day boundary
            if (endDate && txDate > new Date(endDate.getTime() + 86399000)) return false; 
            return true;
        });
    }, [transactions, selectedBank, startDate, endDate]);

    const renderItem = ({ item }: { item: Transaction }) => (
        <Card style={styles.card} mode="elevated" elevation={2}>
            <Card.Content>
                <View style={styles.row}>
                    <Text variant="titleMedium" style={{fontWeight: 'bold'}}>{item.bank_name}</Text>
                    <Text style={{color: item.type === 'CREDIT' ? '#4CAF50' : '#F44336', fontWeight: 'bold', fontSize: 16}}>
                        {item.type === 'CREDIT' ? '+' : '-'} Rs. {item.amount.toFixed(2)}
                    </Text>
                </View>
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>Account: {item.account_number}</Text>
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>{new Date(item.date).toLocaleString()}</Text>
                <View style={styles.messageBox}>
                    <Text variant="bodySmall" style={styles.rawMessage} numberOfLines={2}>
                        {item.raw_message}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FilterBar />
            <FlatList
                data={filteredTransactions}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant}}>No transactions found for these filters.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 12, borderRadius: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    messageBox: { marginTop: 8, padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6 },
    rawMessage: { color: 'gray', fontStyle: 'italic' }
});
