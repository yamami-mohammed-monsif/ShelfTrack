
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '@/lib/types';

const NOTIFICATIONS_STORAGE_KEY = 'bouzid_store_notifications';
const MAX_NOTIFICATIONS = 50; // Keep a reasonable number of notifications
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface NotificationsState {
  notifications: Notification[];
  isLoaded: boolean;
}

// --- Module-level shared state and logic ---
let memoryState: NotificationsState = {
  notifications: [],
  isLoaded: false,
};

const listeners: Array<(state: NotificationsState) => void> = [];

const NotificationActionTypes = {
  SET_LOADED: 'SET_LOADED_NOTIFICATIONS',
  ADD: 'ADD_NOTIFICATION',
  MARK_READ: 'MARK_AS_READ',
  MARK_ALL_READ: 'MARK_ALL_AS_READ',
} as const;

type NotificationAction =
  | { type: typeof NotificationActionTypes.SET_LOADED; payload: Notification[] }
  | { type: typeof NotificationActionTypes.ADD; payload: { newNotification: Notification } }
  | { type: typeof NotificationActionTypes.MARK_READ; payload: { notificationId: string } }
  | { type: typeof NotificationActionTypes.MARK_ALL_READ };


function pruneOldReadNotifications(notifications: Notification[]): Notification[] {
  const now = Date.now();
  return notifications.filter(n => {
    if (n.read && (now - n.timestamp > ONE_WEEK_IN_MS)) {
      return false; // Prune if read and older than one week
    }
    return true;
  });
}

function notificationsReducer(state: NotificationsState, action: NotificationAction): NotificationsState {
  switch (action.type) {
    case NotificationActionTypes.SET_LOADED:
      const prunedInitial = pruneOldReadNotifications(action.payload);
      return {
        notifications: prunedInitial.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_NOTIFICATIONS),
        isLoaded: true,
      };
    case NotificationActionTypes.ADD: {
      const { newNotification } = action.payload;
      if (newNotification.productId) {
        const existingUnreadLowStockNotification = state.notifications.find(
          (n) => n.productId === newNotification.productId && !n.read && n.message.includes("أوشك على النفاد")
        );
        if (existingUnreadLowStockNotification) {
          return state; 
        }
      }
      let updatedNotifications = [newNotification, ...state.notifications];
      updatedNotifications = pruneOldReadNotifications(updatedNotifications);
      updatedNotifications = updatedNotifications
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_NOTIFICATIONS);
      return { ...state, notifications: updatedNotifications };
    }
    case NotificationActionTypes.MARK_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.notificationId ? { ...n, read: true } : n
        ),
      };
    case NotificationActionTypes.MARK_ALL_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    default:
      return state;
  }
}

function dispatch(action: NotificationAction) {
  memoryState = notificationsReducer(memoryState, action);
  if (memoryState.isLoaded) {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(memoryState.notifications));
    } catch (error) {
      console.error("Failed to save notifications to localStorage:", error);
    }
  }
  queueMicrotask(() => {
    listeners.forEach((listener) => listener(memoryState));
  });
}
// --- End of Module-level shared state and logic ---


export function useNotificationsStorage() {
  const [state, setState] = useState<NotificationsState>(memoryState);

  useEffect(() => {
    if (!memoryState.isLoaded) { 
      let initialNotifications: Notification[] = [];
      try {
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotifications) {
          initialNotifications = JSON.parse(storedNotifications);
        }
      } catch (error) {
        console.error("Failed to load notifications from localStorage:", error);
      }
      dispatch({ type: NotificationActionTypes.SET_LOADED, payload: initialNotifications });
    }
    
    const listener = (newState: NotificationsState) => setState(newState);
    listeners.push(listener);
    
    if (memoryState.isLoaded && !state.isLoaded) {
        setState(memoryState);
    }

    return () => { 
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state.isLoaded]); 

  const addNotification = useCallback((
    message: string,
    productId?: string,
    href?: string
  ) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      read: false,
      productId,
      href,
    };
    dispatch({ type: NotificationActionTypes.ADD, payload: { newNotification } });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    dispatch({ type: NotificationActionTypes.MARK_READ, payload: { notificationId } });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: NotificationActionTypes.MARK_ALL_READ });
  }, []);

  // All notifications, already sorted by timestamp descending by the reducer
  const allSortedNotifications = useMemo(() => {
     return state.notifications;
  }, [state.notifications]);

  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.read).length;
  }, [state.notifications]);


  return {
    notifications: allSortedNotifications, 
    // unreadNotifications, // No longer explicitly needed as we iterate allSortedNotifications and check .read
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
    isLoaded: state.isLoaded,
  };
}
