
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '@/lib/types';

const NOTIFICATIONS_STORAGE_KEY = 'bouzid_store_notifications';
const MAX_NOTIFICATIONS = 50; // Keep a reasonable number of notifications

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

function notificationsReducer(state: NotificationsState, action: NotificationAction): NotificationsState {
  switch (action.type) {
    case NotificationActionTypes.SET_LOADED:
      return {
        notifications: action.payload,
        isLoaded: true,
      };
    case NotificationActionTypes.ADD: {
      const { newNotification } = action.payload;
      // For low-stock, prevent duplicate unread notifications for the same product
      if (newNotification.productId) {
        const existingUnreadLowStockNotification = state.notifications.find(
          (n) => n.productId === newNotification.productId && !n.read && n.message.includes("أوشك على النفاد")
        );
        if (existingUnreadLowStockNotification) {
          return state; // No change, duplicate unread low-stock notification
        }
      }
      const updatedNotifications = [newNotification, ...state.notifications]
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
  // Save to localStorage after state update, if initial load is complete
  if (memoryState.isLoaded) {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(memoryState.notifications));
    } catch (error) {
      console.error("Failed to save notifications to localStorage:", error);
    }
  }
  // Notify all listeners
  listeners.forEach((listener) => listener(memoryState));
}
// --- End of Module-level shared state and logic ---


export function useNotificationsStorage() {
  const [state, setState] = useState<NotificationsState>(memoryState);

  useEffect(() => {
    // This effect runs once on mount to load initial state and set up listener
    if (!memoryState.isLoaded) { // Ensure initial load happens only once globally
      let initialNotifications: Notification[] = [];
      try {
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotifications) {
          initialNotifications = JSON.parse(storedNotifications);
        }
      } catch (error) {
        console.error("Failed to load notifications from localStorage:", error);
        // Keep initialNotifications as []
      }
      // Dispatch an action to update the global state and mark as loaded
      dispatch({ type: NotificationActionTypes.SET_LOADED, payload: initialNotifications });
    }
    
    // Subscribe to changes in the global state
    const listener = (newState: NotificationsState) => setState(newState);
    listeners.push(listener);
    
    // Update component state if global state already loaded (e.g. on fast refresh)
    if (memoryState.isLoaded && !state.isLoaded) {
        setState(memoryState);
    }

    return () => { // Cleanup: unsubscribe
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state.isLoaded]); // Rerun if local isLoaded state changes, e.g. after fast refresh

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

  const unreadNotifications = useMemo(() => {
    return state.notifications.filter((n) => !n.read).sort((a,b) => b.timestamp - a.timestamp);
  }, [state.notifications]);

  const unreadCount = useMemo(() => {
    return unreadNotifications.length;
  }, [unreadNotifications]);

  const allSortedNotifications = useMemo(() => {
     return [...state.notifications].sort((a,b) => b.timestamp - a.timestamp);
  }, [state.notifications]);

  return {
    notifications: allSortedNotifications,
    unreadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
    isLoaded: state.isLoaded,
  };
}
