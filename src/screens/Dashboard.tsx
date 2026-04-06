import React, { useCallback, useState, useContext, useMemo } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { getAllTransactions, Transaction } from '../database/db';
import { syncSmsMessages } from '../services/SmsService';
import { useFocusEffect } from '@react-navigation/native';
import { isSameDay, isSameMonth, format } from 'date-fns';
import { AppContext } from '../utils/AppContext';
import FilterBar from '../components/FilterBar';
import LinearGradient from 'react-native-linear-gradient';

export default function DashboardScreen() {
    const theme = useTheme();
    const { selectedBank, startDate, endDate } = useContext(AppContext);
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

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (selectedBank !== 'All' && `${t.bank_name} (${t.account_number})` !== selectedBank) return false;
            const txDate = new Date(t.date);
            if (startDate && txDate < startDate) return false;
            if (endDate && txDate > new Date(endDate.getTime() + 86399000)) return false; // End of day
            return true;
        });
    }, [transactions, selectedBank, startDate, endDate]);

    const today = new Date();
    
    // Today's summary
    const todayTxs = filteredTransactions.filter(t => isSameDay(new Date(t.date), today));
    const todayDebits = todayTxs.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
    const todayCredits = todayTxs.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);

    // Monthly summary
    const monthTxs = filteredTransactions.filter(t => isSameMonth(new Date(t.date), today));
    const monthDebits = monthTxs.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
    const monthCredits = monthTxs.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <FilterBar />

            <View style={{ margin: 16 }}>
                {/* Today Summary */}
                <Card style={styles.card} mode="elevated" elevation={4}>
                    <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.gradientCard}>
                        <Card.Content>
                            <Text variant="titleLarge" style={styles.cardHeader}>Today's Summary</Text>
                            <View style={styles.row}>
                                <View style={styles.amountBox}>
                                    <Text style={styles.label}>CREDIT</Text>
                                    <Text style={styles.creditText}>+ {todayCredits.toFixed(2)}</Text>
                                </View>
                                <View style={styles.amountBox}>
                                    <Text style={styles.label}>DEBIT</Text>
                                    <Text style={styles.debitText}>- {todayDebits.toFixed(2)}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </LinearGradient>
                </Card>

                {/* Monthly Summary */}
                <Card style={styles.card} mode="elevated" elevation={4}>
                    <LinearGradient colors={['#a18cd1', '#fbc2eb']} style={styles.gradientCard}>
                        <Card.Content>
                            <Text variant="titleLarge" style={styles.cardHeader}>{format(today, 'MMMM')} Summary</Text>
                            <View style={styles.row}>
                                <View style={styles.amountBox}>
                                    <Text style={styles.label}>CREDIT</Text>
                                    <Text style={styles.creditText}>+ {monthCredits.toFixed(2)}</Text>
                                </View>
                                <View style={styles.amountBox}>
                                    <Text style={styles.label}>DEBIT</Text>
                                    <Text style={styles.debitText}>- {monthDebits.toFixed(2)}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </LinearGradient>
                </Card>

                <Button mode="contained-tonal" icon="sync" onPress={onRefresh} style={{marginBottom: 20}}>
                    Sync SMS Messages
                </Button>

                <Text variant="titleMedium" style={styles.sectionTitle}>Recent Transactions</Text>
                {filteredTransactions.length === 0 && <Text style={{textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant}}>No transactions found.</Text>}
                {filteredTransactions.slice(0, 10).map(tx => (
                    <Card key={tx.id} style={styles.txCard} mode="elevated" elevation={2}>
                        <Card.Content style={styles.row}>
                            <View style={{flexShrink: 1}}>
                                <Text variant="labelLarge" style={{fontWeight: 'bold'}}>{tx.bank_name} ({tx.account_number})</Text>
                                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>{new Date(tx.date).toLocaleString()}</Text>
                            </View>
                            <Text style={{color: tx.type === 'CREDIT' ? '#4CAF50' : '#F44336', fontWeight: 'bold', fontSize: 16}}>
                                {tx.type === 'CREDIT' ? '+' : '-'} Rs. {tx.amount.toFixed(2)}
                            </Text>
                        </Card.Content>
                    </Card>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 16, overflow: 'hidden', borderRadius: 16 },
    gradientCard: { paddingVertical: 10 },
    cardHeader: { color: '#333', fontWeight: 'bold', marginBottom: 15 },
    txCard: { marginBottom: 10, borderRadius: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountBox: { alignItems: 'center' },
    label: { fontSize: 12, fontWeight: 'bold', color: '#555', letterSpacing: 1 },
    creditText: { color: '#006400', fontWeight: 'bold', fontSize: 20 },
    debitText: { color: '#8B0000', fontWeight: 'bold', fontSize: 20 },
    sectionTitle: { marginBottom: 12, fontWeight: 'bold', marginLeft: 4 }
});
