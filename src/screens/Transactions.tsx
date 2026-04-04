import React, { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { getAllTransactions, Transaction } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useFocusEffect(
        useCallback(() => {
            getAllTransactions().then(setTransactions);
        }, [])
    );

    const renderItem = ({ item }: { item: Transaction }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.row}>
                    <Text variant="titleMedium">{item.bank_name}</Text>
                    <Text style={{color: item.type === 'CREDIT' ? 'green' : 'red', fontWeight: 'bold'}}>
                        {item.type === 'CREDIT' ? '+' : '-'} Rs. {item.amount.toFixed(2)}
                    </Text>
                </View>
                <Text variant="bodySmall">Account: {item.account_number}</Text>
                <Text variant="bodySmall">{new Date(item.date).toLocaleString()}</Text>
                <Text variant="bodySmall" style={styles.rawMessage} numberOfLines={2}>
                    {item.raw_message}
                </Text>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No transactions yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: { marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rawMessage: { marginTop: 8, color: 'gray', fontStyle: 'italic' }
});
