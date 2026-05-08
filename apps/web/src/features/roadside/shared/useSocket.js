import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getApiUrl } from '../../../shared/helpers';

// Returns a stable socket.io socket for the /roadside namespace.
// Disconnects automatically when the component unmounts.
export function useSocket(token) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const base = getApiUrl('').replace('/api', '');
    const socket = io(`${base}/roadside`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return socketRef;
}
