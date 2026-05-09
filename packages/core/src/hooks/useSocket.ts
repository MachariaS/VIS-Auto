import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(serverUrl: string, token: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !serverUrl) return;

    const socket = io(`${serverUrl}/roadside`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl, token]);

  return socketRef;
}
