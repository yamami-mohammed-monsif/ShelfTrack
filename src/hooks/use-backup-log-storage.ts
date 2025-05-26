
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BackupLogEntry } from '@/lib/types';

const BACKUP_LOG_STORAGE_KEY = 'shelftrack_backup_log';

interface BackupLogState {
  logs: BackupLogEntry[];
  isLoaded: boolean;
}

let memoryState: BackupLogState = {
  logs: [],
  isLoaded: false,
};

const listeners: Array<(state: BackupLogState) => void> = [];

export const BackupLogActionTypes = {
  SET_LOADED: 'SET_LOADED_BACKUP_LOGS',
  ADD_ENTRY: 'ADD_BACKUP_LOG_ENTRY',
  CLEAR_ALL: 'CLEAR_ALL_BACKUP_LOGS', // For global app reset
} as const;

type BackupLogAction =
  | { type: typeof BackupLogActionTypes.SET_LOADED; payload: BackupLogEntry[] }
  | { type: typeof BackupLogActionTypes.ADD_ENTRY; payload: { newEntry: BackupLogEntry } }
  | { type: typeof BackupLogActionTypes.CLEAR_ALL };

function backupLogReducer(state: BackupLogState, action: BackupLogAction): BackupLogState {
  switch (action.type) {
    case BackupLogActionTypes.SET_LOADED:
      return {
        logs: action.payload.sort((a, b) => b.timestamp - a.timestamp), // Show newest first
        isLoaded: true,
      };
    case BackupLogActionTypes.ADD_ENTRY:
      return {
        ...state,
        logs: [action.payload.newEntry, ...state.logs].sort((a, b) => b.timestamp - a.timestamp),
      };
    case BackupLogActionTypes.CLEAR_ALL:
      return {
        logs: [],
        isLoaded: state.isLoaded, // Keep isLoaded true, just clear the data
      };
    default:
      return state;
  }
}

function dispatch(action: BackupLogAction) {
  memoryState = backupLogReducer(memoryState, action);
  if (memoryState.isLoaded) {
    try {
      if (action.type === BackupLogActionTypes.CLEAR_ALL) {
        localStorage.removeItem(BACKUP_LOG_STORAGE_KEY);
      } else {
        localStorage.setItem(BACKUP_LOG_STORAGE_KEY, JSON.stringify(memoryState.logs));
      }
    } catch (error) {
      console.error("Failed to update backup logs in localStorage:", error);
    }
  }
  // Notify listeners after state update and localStorage attempt
  queueMicrotask(() => {
    listeners.forEach((listener) => listener(memoryState));
  });
}

export function useBackupLogStorage() {
  const [state, setState] = useState<BackupLogState>(memoryState);

  useEffect(() => {
    if (!memoryState.isLoaded) {
      let initialLogs: BackupLogEntry[] = [];
      try {
        const storedLogs = localStorage.getItem(BACKUP_LOG_STORAGE_KEY);
        if (storedLogs) {
          initialLogs = JSON.parse(storedLogs);
        }
      } catch (error) {
        console.error("Failed to load backup logs from localStorage:", error);
        // In case of parsing error, start with an empty log
        initialLogs = [];
      }
      dispatch({ type: BackupLogActionTypes.SET_LOADED, payload: initialLogs });
    }

    const listener = (newState: BackupLogState) => setState(newState);
    listeners.push(listener);

    // If the global state was already loaded (e.g., by another instance of the hook or fast refresh)
    // ensure this component instance gets the current state.
    if (memoryState.isLoaded && !state.isLoaded) {
        setState(memoryState);
    }

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state.isLoaded]); // Effect should re-run if isLoaded state changes locally (though typically it won't after first load)

  const addLogEntry = useCallback((entryData: {
    timestamp: number;
    periodStart: number;
    periodEnd: number;
    fileName: string;
  }): BackupLogEntry => {
    const newEntry: BackupLogEntry = {
      ...entryData,
      id: crypto.randomUUID(),
    };
    dispatch({ type: BackupLogActionTypes.ADD_ENTRY, payload: { newEntry } });
    return newEntry;
  }, []);
  
  const clearAllBackupLogs = useCallback(() => {
    dispatch({ type: BackupLogActionTypes.CLEAR_ALL });
  }, []);

  // Memoize sorted logs to prevent unnecessary re-renders if state.logs reference changes but content is same
  const sortedLogs = useMemo(() => {
    return state.logs; // The reducer already sorts, so this is mainly for stable reference
  }, [state.logs]);

  return {
    backupLogs: sortedLogs,
    addLogEntry,
    clearAllBackupLogs,
    isLoaded: state.isLoaded,
  };
}
