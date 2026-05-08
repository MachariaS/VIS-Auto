import { useEffect, useRef, useState } from 'react';
import { request } from '../../../../shared/helpers';
import { useSocket } from '../../shared/useSocket';

export default function useRequestTracking({ token, selectedRequest }) {
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const socketRef = useSocket(token);
  const pollingRef = useRef(null);

  const requestId = selectedRequest?.id;
  const isActive =
    selectedRequest?.status === 'searching' ||
    selectedRequest?.status === 'provider_assigned' ||
    selectedRequest?.status === 'in_progress';

  // Initial REST fetch + polling fallback
  useEffect(() => {
    if (!token || !requestId) {
      setTracking(null);
      setTrackingError('');
      setTrackingLoading(false);
      return;
    }

    const controller = new AbortController();

    async function poll() {
      setTrackingLoading(true);
      try {
        const data = await request(
          `/roadside-requests/${requestId}/status`,
          undefined,
          'GET',
          token,
          controller.signal,
        );
        setTracking(data);
        setTrackingError('');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setTrackingError(err.message || 'Unable to load live tracking.');
      } finally {
        if (!controller.signal.aborted) setTrackingLoading(false);
      }
    }

    void poll();

    // Poll every 5s while active (WS handles real-time, this catches gaps)
    if (isActive) {
      pollingRef.current = window.setInterval(poll, 5000);
    }

    return () => {
      controller.abort();
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [requestId, token, isActive]);

  // WebSocket: join request room, listen for real-time updates
  useEffect(() => {
    if (!requestId || !isActive) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join-request', requestId);

    function onTrackingUpdate(data) {
      setTracking((prev) => prev ? { ...prev, ...data } : data);
    }

    function onStatusUpdate(data) {
      setTracking((prev) => prev ? { ...prev, ...data } : data);
    }

    socket.on('tracking-update', onTrackingUpdate);
    socket.on('status-update', onStatusUpdate);

    return () => {
      socket.off('tracking-update', onTrackingUpdate);
      socket.off('status-update', onStatusUpdate);
    };
  }, [requestId, isActive, socketRef]);

  return { tracking, trackingError, trackingLoading };
}
