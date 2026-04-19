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

    let isDisposed = false;

    async function loadTracking() {
      setTrackingLoading(true);
      try {
        const nextTracking = await request(
          `/roadside-requests/${selectedRequest.id}/status`,
          undefined,
          'GET',
          token,
        );
        if (!isDisposed) {
          setTracking(nextTracking);
          setTrackingError('');
        }
      } catch (error) {
        if (!isDisposed) {
          setTrackingError(error.message || 'Unable to load live tracking.');
        }
      } finally {
        if (!isDisposed) {
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
      return () => {
        isDisposed = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void loadTracking();
    }, 10000);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [selectedRequest, token]);

  return {
    tracking,
    trackingError,
    trackingLoading,
  };
}
