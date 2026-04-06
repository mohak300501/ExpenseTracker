import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSetting, setSetting } from '../database/db';

interface AppContextType {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    selectedBank: string;
    setSelectedBank: (bank: string) => void;
    startDate: Date | null;
    setStartDate: (date: Date | null) => void;
    endDate: Date | null;
    setEndDate: (date: Date | null) => void;
}

export const AppContext = createContext<AppContextType>({
    theme: 'light',
    setTheme: () => {},
    selectedBank: 'All',
    setSelectedBank: () => {},
    startDate: null,
    setStartDate: () => {},
    endDate: null,
    setEndDate: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<'light' | 'dark'>('light');
    const [selectedBank, setSelectedBank] = useState<string>('All');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    useEffect(() => {
        getSetting('theme').then(val => {
            if (val === 'dark' || val === 'light') {
                setThemeState(val);
            }
        });
    }, []);

    const setTheme = (newTheme: 'light' | 'dark') => {
        setThemeState(newTheme);
        setSetting('theme', newTheme);
    };

    return (
        <AppContext.Provider value={{
            theme, setTheme,
            selectedBank, setSelectedBank,
            startDate, setStartDate,
            endDate, setEndDate,
        }}>
            {children}
        </AppContext.Provider>
    );
};
