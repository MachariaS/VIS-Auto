import { useEffect, useState } from 'react';
import { request } from '../../../shared/helpers';

export default function useRequestTracking({ token, selectedRequest }) {
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    if (!token || !selectedRequest) {
      setTracking(null);
      setTrackingError('');
      setTrackingLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadTracking() {
      setTrackingLoading(true);
      try {
        const nextTracking = await request(
          `/roadside-requests/${selectedRequest.id}/status`,
          undefined,
          'GET',
          token,
          controller.signal,
        );
        setTracking(nextTracking);
        setTrackingError('');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setTrackingError(error.message || 'Unable to load live tracking.');
      } finally {
        if (!controller.signal.aborted) {
          setTrackingLoading(false);
        }
      }
    }

    void loadTracking();

    const isActiveRequest =
      selectedRequest.status === 'searching' ||
      selectedRequest.status === 'provider_assigned' ||
      selectedRequest.status === 'in_progress';

    if (!isActiveRequest) {
      return () => controller.abort();
    }

    const intervalId = window.setInterval(() => {
      void loadTracking();
    }, 10000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [selectedRequest, token]);

  return {
    tracking,
    trackingError,
    trackingLoading,
  };
}
