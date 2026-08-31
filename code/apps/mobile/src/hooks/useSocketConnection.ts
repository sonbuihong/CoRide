import { useSyncExternalStore } from 'react';

import { socketService } from '../services/socket.service';

const getServerSnapshot = () => false;

export function useSocketConnection(): boolean {
  return useSyncExternalStore(
    socketService.subscribeConnection,
    socketService.getConnectionSnapshot,
    getServerSnapshot,
  );
}

export function getRealtimeRefetchInterval(isSocketConnected: boolean): number | false {
  return isSocketConnected ? false : 30_000;
}
