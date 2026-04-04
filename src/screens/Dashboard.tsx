import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { getAllTransactions, Transaction } from '../database/db';
import { syncSmsMessages } from '../services/SmsService';
import { useFocusEffect } from '@react-navigation/native';
import { isSameDay } from 'date-fns';

export default function DashboardScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        const txs = await getAllTransactions();
        setTransactions(txs);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await syncSmsMessages();
        await loadData();
        setRefreshing(false);
    };

    const today = new Date();
    const todayTxs = transactions.filter(t => isSameDay(new Date(t.date), today));
    const debits = todayTxs.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
    const credits = todayTxs.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge">Today's Summary</Text>
                    <View style={styles.row}>
                        <Text style={{color: 'red'}}>Debited: Rs. {debits.toFixed(2)}</Text>
                        <Text style={{color: 'green'}}>Credited: Rs. {credits.toFixed(2)}</Text>
                    </View>
                </Card.Content>
                <Card.Actions>
                    <Button onPress={onRefresh}>Sync SMS</Button>
                </Card.Actions>
            </Card>

            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length === 0 && <Text style={{textAlign: 'center', marginTop: 20}}>No transactions. Pull to sync SMS.</Text>}
            {transactions.slice(0, 10).map(tx => (
                <Card key={tx.id} style={styles.txCard}>
                    <Card.Content style={styles.row}>
                        <View>
                            <Text variant="labelLarge">{tx.bank_name} ({tx.account_number})</Text>
                            <Text variant="bodySmall">{new Date(tx.date).toLocaleString()}</Text>
                        </View>
                        <Text style={{color: tx.type === 'CREDIT' ? 'green' : 'red', fontWeight: 'bold'}}>
                            {tx.type === 'CREDIT' ? '+' : '-'} Rs. {tx.amount.toFixed(2)}
                        </Text>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: { marginBottom: 16 },
    txCard: { marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
    sectionTitle: { marginBottom: 8 }
});
