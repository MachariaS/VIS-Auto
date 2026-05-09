import { useEffect, useRef, useState } from 'react';
import { request } from '../api/client';
import { useSocket } from './useSocket';
import type { TrackingStatus, RoadsideRequest, RedispatchMessage } from '../types/roadside';

interface UseRequestTrackingOptions {
  baseUrl: string;
  serverUrl: string;
  token: string | undefined;
  selectedRequest: Pick<RoadsideRequest, 'id' | 'status'> | null | undefined;
}

export function useRequestTracking({
  baseUrl,
  serverUrl,
  token,
  selectedRequest,
}: UseRequestTrackingOptions) {
  const [tracking, setTracking] = useState<TrackingStatus | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [redispatchMsg, setRedispatchMsg] = useState<RedispatchMessage | null>(null);
  const socketRef = useSocket(serverUrl, token);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestId = selectedRequest?.id;
  const isActive =
    selectedRequest?.status === 'searching' ||
    selectedRequest?.status === 'provider_assigned' ||
    selectedRequest?.status === 'in_progress';

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
        const data = await request<TrackingStatus>(
          baseUrl,
          `/roadside-requests/${requestId}/status`,
          undefined,
          'GET',
          token,
          controller.signal,
        );
        setTracking(data);
        setTrackingError('');
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setTrackingError(err.message || 'Unable to load live tracking.');
      } finally {
        if (!controller.signal.aborted) setTrackingLoading(false);
      }
    }

    void poll();

    if (isActive) {
      pollingRef.current = setInterval(poll, 5000);
    }

    return () => {
      controller.abort();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [requestId, token, isActive, baseUrl]);

  useEffect(() => {
    if (!requestId || !isActive) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join-request', requestId);

    function onTrackingUpdate(data: Partial<TrackingStatus>) {
      setTracking((prev) => (prev ? { ...prev, ...data } : (data as TrackingStatus)));
    }

    function onStatusUpdate(data: Partial<TrackingStatus>) {
      setTracking((prev) => (prev ? { ...prev, ...data } : (data as TrackingStatus)));
    }

    function onRedispatchUpdate(data: RedispatchMessage) {
      setRedispatchMsg(data);
      if (!data.exhausted) {
        setTimeout(
          () => setRedispatchMsg((m) => (m === data ? null : m)),
          8000,
        );
      }
    }

    socket.on('tracking-update', onTrackingUpdate);
    socket.on('status-update', onStatusUpdate);
    socket.on('re-dispatch-update', onRedispatchUpdate);

    return () => {
      socket.off('tracking-update', onTrackingUpdate);
      socket.off('status-update', onStatusUpdate);
      socket.off('re-dispatch-update', onRedispatchUpdate);
    };
  }, [requestId, isActive, socketRef]);

  return { tracking, trackingError, trackingLoading, redispatchMsg };
}
