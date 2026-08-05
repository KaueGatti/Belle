import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useData } from '../context/DataContext';
import {
  initNotifications,
  ensureNotificationChannel,
  ensurePermissions,
  syncNotifications,
  isNotificationsEnabled,
  cancelAllNotifications,
} from '../utils/notifications';

export default function NotificationSync() {
  const { agendamentos, clientes, servicos } = useData();
  const didInit = useRef(false);
  const appState = useRef(AppState.currentState);
  const syncQueue = useRef(Promise.resolve());

  const runSync = useCallback(() => {
    const task = syncQueue.current.then(async () => {
      try {
        if (!didInit.current) {
          didInit.current = true;
          initNotifications();
          await ensureNotificationChannel();
          if (await isNotificationsEnabled()) {
            await ensurePermissions();
          }
        }
        if (await isNotificationsEnabled()) {
          await syncNotifications(agendamentos, clientes, servicos);
        } else {
          await cancelAllNotifications();
        }
      } catch (e) {
        console.warn('NotificationSync', e);
      }
    });
    syncQueue.current = task;
  }, [agendamentos, clientes, servicos]);

  const runSyncRef = useRef(runSync);
  runSyncRef.current = runSync;

  useEffect(() => {
    runSync();
  }, [runSync]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current !== 'active' && nextState === 'active') {
        runSyncRef.current();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return null;
}
