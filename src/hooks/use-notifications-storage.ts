
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '@/lib/types';

const NOTIFICATIONS_STORAGE_KEY = 'bouzid_store_notifications';
const MAX_NOTIFICATIONS = 50; // Keep a reasonable number of notifications

export function useNotificationsStorage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error("Failed to load notifications from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      } catch (error) {
        console.error("Failed to save notifications to localStorage:", error);
      }
    }
  }, [notifications, isLoaded]);

  const addNotification = useCallback((
    message: string,
    productId?: string,
    href?: string
  ) => {
    setNotifications((prevNotifications) => {
      // For low-stock, prevent duplicate unread notifications for the same product
      if (productId) {
        const existingUnreadLowStockNotification = prevNotifications.find(
          (n) => n.productId === productId && !n.read && n.message.includes("أوشك على النفاد")
        );
        if (existingUnreadLowStockNotification) {
          return prevNotifications; // Don't add if one already exists
        }
      }

      const newNotification: Notification = {
        id: crypto.randomUUID(),
        message,
        timestamp: Date.now(),
        read: false,
        productId,
        href,
      };
      // Add new notification and keep the list sorted by timestamp, limit size
      const updatedNotifications = [newNotification, ...prevNotifications]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_NOTIFICATIONS);
      return updatedNotifications;
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) => ({ ...n, read: true }))
    );
  }, []);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read).sort((a,b) => b.timestamp - a.timestamp);
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return unreadNotifications.length;
  }, [unreadNotifications]);

  const allSortedNotifications = useMemo(() => {
     return [...notifications].sort((a,b) => b.timestamp - a.timestamp);
  }, [notifications]);


  return {
    notifications: allSortedNotifications,
    unreadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
    isLoaded,
  };
}
