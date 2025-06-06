
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '@/lib/types';

const NOTIFICATIONS_STORAGE_KEY = 'shelftrack_notifications';
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

export const NotificationActionTypes = {
  SET_LOADED: 'SET_LOADED_NOTIFICATIONS',
  ADD: 'ADD_NOTIFICATION',
  MARK_READ: 'MARK_AS_READ',
  MARK_ALL_READ: 'MARK_ALL_AS_READ',
  CLEAR_ALL: 'CLEAR_ALL_NOTIFICATIONS',
  DELETE_BY_PRODUCT_ID: 'DELETE_BY_PRODUCT_ID',
} as const;

type NotificationAction =
  | { type: typeof NotificationActionTypes.SET_LOADED; payload: Notification[] }
  | { type: typeof NotificationActionTypes.ADD; payload: { newNotification: Notification } }
  | { type: typeof NotificationActionTypes.MARK_READ; payload: { notificationId: string } }
  | { type: typeof NotificationActionTypes.MARK_ALL_READ }
  | { type: typeof NotificationActionTypes.CLEAR_ALL }
  | { type: typeof NotificationActionTypes.DELETE_BY_PRODUCT_ID; payload: { productId: string } };


function pruneOldReadNotifications(notifications: Notification[]): Notification[] {
  const now = Date.now();
  return notifications.filter(n => {
    if (n.read && (now - n.timestamp > ONE_WEEK_IN_MS)) {
      return false; // Prune if read and older than one week
    }
    return true;
  });
}

function notificationsReducer(currentNotifications: Notification[], action: NotificationAction): Notification[] { // Changed from state to currentNotifications
  switch (action.type) {
    case NotificationActionTypes.SET_LOADED:
      const prunedInitial = pruneOldReadNotifications(action.payload);
      return prunedInitial.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_NOTIFICATIONS);
    case NotificationActionTypes.ADD: {
      const { newNotification } = action.payload;
      if (newNotification.productId) {
        const existingUnreadLowStockNotification = currentNotifications.find(
          (n) => n.productId === newNotification.productId && !n.read && n.message.includes("أوشك على النفاد")
        );
        if (existingUnreadLowStockNotification) {
          return currentNotifications; 
        }
      }
      let updatedNotifications = [newNotification, ...currentNotifications];
      updatedNotifications = pruneOldReadNotifications(updatedNotifications);
      updatedNotifications = updatedNotifications
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_NOTIFICATIONS);
      return updatedNotifications;
    }
    case NotificationActionTypes.MARK_READ:
      return currentNotifications.map((n) =>
          n.id === action.payload.notificationId ? { ...n, read: true } : n
        );
    case NotificationActionTypes.MARK_ALL_READ:
      return currentNotifications.map((n) => ({ ...n, read: true }));
    case NotificationActionTypes.CLEAR_ALL:
      return [];
    case NotificationActionTypes.DELETE_BY_PRODUCT_ID:
      return currentNotifications.filter(n => n.productId !== action.payload.productId);
    default:
      return currentNotifications;
  }
}

function dispatchNotification(action: NotificationAction) { 
  memoryState = {
      ...memoryState,
      notifications: notificationsReducer(memoryState.notifications, action),
  };

  if (action.type === NotificationActionTypes.SET_LOADED) {
    memoryState.isLoaded = true;
  }

  if (memoryState.isLoaded) {
    try {
      if (action.type === NotificationActionTypes.CLEAR_ALL) {
        localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      } else {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(memoryState.notifications));
      }
    } catch (error) {
      console.error("Failed to update notifications in localStorage:", error);
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
      dispatchNotification({ type: NotificationActionTypes.SET_LOADED, payload: initialNotifications });
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
    dispatchNotification({ type: NotificationActionTypes.ADD, payload: { newNotification } });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    dispatchNotification({ type: NotificationActionTypes.MARK_READ, payload: { notificationId } });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatchNotification({ type: NotificationActionTypes.MARK_ALL_READ });
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    dispatchNotification({ type: NotificationActionTypes.CLEAR_ALL });
  }, []);

  const deleteNotificationsByProductId = useCallback((productId: string) => {
    dispatchNotification({ type: NotificationActionTypes.DELETE_BY_PRODUCT_ID, payload: { productId } });
  }, []);

  const notificationsDispatch = useCallback((action: NotificationAction) => {
    dispatchNotification(action);
  },[]);


  const allSortedNotifications = useMemo(() => {
     return state.notifications;
  }, [state.notifications]);

  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.read).length;
  }, [state.notifications]);


  return {
    notifications: allSortedNotifications, 
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotificationsByProductId,
    dispatchNotification: notificationsDispatch, // Expose dispatch for direct use
    unreadCount,
    isLoaded: state.isLoaded,
  };
}
