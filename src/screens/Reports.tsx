import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { BarChart } from 'react-native-gifted-charts';
import { getAllTransactions, Transaction } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

export default function ReportsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [period, setPeriod] = useState('daily');

    useFocusEffect(
        useCallback(() => {
            getAllTransactions().then(setTransactions);
        }, [])
    );

    // Grouping logic based on period
    const getChartData = () => {
        const grouped: { [key: string]: number } = {};
        
        // Reverse to process oldest to newest for chart order
        const reverseTxs = [...transactions].reverse();
        
        reverseTxs.forEach(tx => {
            if (tx.type === 'CREDIT') return; // Only showing spend (Debits)
            const dateObj = new Date(tx.date);
            let key = '';
            if (period === 'daily') key = format(dateObj, 'MMM dd');
            if (period === 'monthly') key = format(dateObj, 'MMM yyyy');
            if (period === 'yearly') key = format(dateObj, 'yyyy');
            
            grouped[key] = (grouped[key] || 0) + tx.amount;
        });

        // Convert to array and take last 7 items to fit screen
        return Object.keys(grouped).map(k => ({
            label: k, 
            value: grouped[k],
            frontColor: '#ff5c5c'
        })).slice(-7);
    };

    const data = getChartData();

    return (
        <ScrollView style={styles.container}>
            <SegmentedButtons
                value={period}
                onValueChange={setPeriod}
                buttons={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                ]}
                style={styles.segmented}
            />

            <View style={styles.chartContainer}>
                {data.length > 0 ? (
                    <BarChart
                        data={data}
                        barWidth={30}
                        spacing={20}
                        roundedTop
                        xAxisLabelTextStyle={{color: 'gray', fontSize: 10}}
                        yAxisTextStyle={{color: 'gray', fontSize: 10}}
                        isAnimated
                    />
                ) : (
                    <Text style={{textAlign: 'center', marginTop: 50}}>No data available for charts.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    segmented: { marginBottom: 20 },
    chartContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20 }
});
