import SmsAndroid from 'react-native-get-sms-android';
import { PermissionsAndroid } from 'react-native';
import { parseSms } from './SmsParser';
import { insertTransaction, getSetting, setSetting } from '../database/db';

export const requestSmsPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            {
                title: 'SMS Read Permission',
                message: 'ExpenseTracker needs access to your messages to track bank transactions.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        console.warn(err);
        return false;
    }
};

export const syncSmsMessages = async () => {
    const hasPermission = await requestSmsPermission();
    if (!hasPermission) return false;

    const lastSyncStr = await getSetting('last_sync_timestamp');
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;

    return new Promise<boolean>((resolve, reject) => {
        const filter = {
            box: 'inbox',
            minDate: lastSync,
        };

        SmsAndroid.list(
            JSON.stringify(filter),
            (fail: string) => {
                console.error('Failed with this error: ' + fail);
                resolve(false);
            },
            async (count: number, smsList: string) => {
                const messages = JSON.parse(smsList);
                let latestDate = lastSync;

                for (const msg of messages) {
                    const parsed = parseSms(msg.address, msg.body, msg.date);
                    if (parsed) {
                        await insertTransaction(parsed);
                    }
                    if (msg.date > latestDate) {
                        latestDate = msg.date;
                    }
                }

                if (latestDate > lastSync) {
                    await setSetting('last_sync_timestamp', latestDate.toString());
                }
                resolve(true);
            },
        );
    });
};
