import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { syncSmsMessages } from './SmsService';
import { getAllTransactions, getSetting, setSetting } from '../database/db';
import { isSameDay } from 'date-fns';

const BACKGROUND_FETCH_TASK = 'background-fetch-sms';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const isNewData = await syncSmsMessages();
    
    // Check if it's time to notify
    const notifyTimeStr = await getSetting('notification_time'); // "21:00"
    if (notifyTimeStr) {
      const [hour, minute] = notifyTimeStr.split(':').map(Number);
      const now = new Date();
      // Simple heuristic: if it's the target hour, check if we already notified today
      if (now.getHours() === hour) {
        const lastNotifiedStr = await getSetting('last_notified_date');
        const lastNotified = lastNotifiedStr ? parseInt(lastNotifiedStr, 10) : 0;
        
        if (!isSameDay(new Date(lastNotified), now)) {
          // Generate Summary
          const txs = await getAllTransactions();
          const todayTxs = txs.filter(t => isSameDay(new Date(t.date), now));
          const debits = todayTxs.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
          const credits = todayTxs.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Daily Spend Summary",
              body: `Debited: Rs. ${debits.toFixed(2)} | Credited: Rs. ${credits.toFixed(2)}`,
            },
            trigger: null, // deliver immediately
          });

          await setSetting('last_notified_date', now.getTime().toString());
        }
      }
    }

    return isNewData ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundFetchAsync = async () => {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 60, // 1 hour
    stopOnTerminate: false, // android only, keep running when app killed
    startOnBoot: true, // android only
  });
};

export const unregisterBackgroundFetchAsync = async () => {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
};
