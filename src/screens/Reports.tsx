import React, { useCallback, useState, useContext, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { BarChart } from 'react-native-gifted-charts';
import { getAllTransactions, Transaction } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { AppContext } from '../utils/AppContext';
import FilterBar from '../components/FilterBar';

export default function ReportsScreen() {
    const theme = useTheme();
    const { selectedBank, startDate, endDate } = useContext(AppContext);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [period, setPeriod] = useState('daily');
    const [chartHeight, setChartHeight] = useState(250); // Default, updated onLayout

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
            if (endDate && txDate > new Date(endDate.getTime() + 86399000)) return false; 
            return true;
        });
    }, [transactions, selectedBank, startDate, endDate]);

    // Grouping logic based on period
    const chartData = useMemo(() => {
        const grouped: { [key: string]: number } = {};
        
        // Reverse to process oldest to newest for chart order
        const reverseTxs = [...filteredTransactions].reverse();
        
        reverseTxs.forEach(tx => {
            if (tx.type === 'CREDIT') return; // Only showing spend (Debits)
            const dateObj = new Date(tx.date);
            let key = '';
            if (period === 'daily') key = format(dateObj, 'MMM dd');
            if (period === 'monthly') key = format(dateObj, 'MMM yyyy');
            if (period === 'yearly') key = format(dateObj, 'yyyy');
            
            grouped[key] = (grouped[key] || 0) + tx.amount;
        });

        // Convert to array
        const fullData = Object.keys(grouped).map(k => ({
            label: k, 
            value: grouped[k],
            frontColor: '#ff5c5c'
        }));

        // Limit to last 7-10 depending on space
        return fullData.slice(-10);
    }, [filteredTransactions, period]);

    const isDarkMode = theme.dark;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FilterBar />

            <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
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
            </View>

            <View 
                style={styles.chartContainer} 
                onLayout={(event) => {
                    // Make chart aggressively fill the rest of the flex space
                    const { height } = event.nativeEvent.layout;
                    if (height > 100) {
                        setChartHeight(height - 100); // Buffer for labels
                    }
                }}
            >
                {chartData.length > 0 ? (
                    <BarChart
                        data={chartData}
                        height={chartHeight} // Dynamic height
                        barWidth={28}
                        spacing={15}
                        roundedTop
                        xAxisLabelTextStyle={{color: isDarkMode ? 'lightgray' : 'gray', fontSize: 10}}
                        yAxisTextStyle={{color: isDarkMode ? 'lightgray' : 'gray', fontSize: 10}}
                        yAxisColor={isDarkMode ? 'lightgray' : 'gray'}
                        xAxisColor={isDarkMode ? 'lightgray' : 'gray'}
                        isAnimated
                        noOfSections={5}
                    />
                ) : (
                    <Text style={{textAlign: 'center', marginTop: 50, color: theme.colors.onSurfaceVariant}}>No debit data for the selected filters.</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    segmented: { marginBottom: 15 },
    chartContainer: { 
        flex: 1, // fill available space
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingRight: 10 
    }
});
