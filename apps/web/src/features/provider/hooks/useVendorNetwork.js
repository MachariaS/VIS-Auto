import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  acceptVendorRequest as acceptVendorRequestApi,
  fetchVendorNetwork,
  rejectVendorRequest as rejectVendorRequestApi,
} from '../api/vendorApi';

const emptyVendorNetwork = {
  activePartners: [],
  pendingRequests: [],
  rejectedRequests: [],
};

export default function useVendorNetwork({ token, user, addToast }) {
  const [vendorNetwork, setVendorNetwork] = useState(emptyVendorNetwork);
  const [selectedVendorRequestId, setSelectedVendorRequestId] = useState('');
  const [vendorActionRequestId, setVendorActionRequestId] = useState('');
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState('');

  const activeVendorPartners = vendorNetwork.activePartners || [];
  const pendingVendorRequests = vendorNetwork.pendingRequests || [];
  const rejectedVendorRequests = vendorNetwork.rejectedRequests || [];

  const focusedVendorRequest =
    pendingVendorRequests.find((requestItem) => requestItem.id === selectedVendorRequestId) ||
    pendingVendorRequests[0] ||
    null;

  const vendorStats = useMemo(
    () => ({
      active: activeVendorPartners.length,
      pending: pendingVendorRequests.length,
      rejected: rejectedVendorRequests.length,
    }),
    [activeVendorPartners.length, pendingVendorRequests.length, rejectedVendorRequests.length],
  );

  useEffect(() => {
    if (pendingVendorRequests.length === 0) {
      if (selectedVendorRequestId) setSelectedVendorRequestId('');
      return;
    }

    if (!pendingVendorRequests.some((requestItem) => requestItem.id === selectedVendorRequestId)) {
      setSelectedVendorRequestId(pendingVendorRequests[0].id);
    }
  }, [pendingVendorRequests, selectedVendorRequestId]);

  const loadVendorData = useCallback(async (accessToken = token) => {
    if (!accessToken || user?.accountType !== 'provider') {
      setVendorNetwork(emptyVendorNetwork);
      setVendorError('');
      return emptyVendorNetwork;
    }

    setVendorLoading(true);
    setVendorError('');
    try {
      const data = await fetchVendorNetwork(accessToken);
      const normalized = {
        activePartners: Array.isArray(data?.activePartners) ? data.activePartners : [],
        pendingRequests: Array.isArray(data?.pendingRequests) ? data.pendingRequests : [],
        rejectedRequests: Array.isArray(data?.rejectedRequests) ? data.rejectedRequests : [],
      };
      setVendorNetwork(normalized);
      return normalized;
    } catch (error) {
      const nextError = error.message || 'Unable to load vendor data.';
      setVendorError(nextError);
      throw error;
    } finally {
      setVendorLoading(false);
    }
  }, [token, user?.accountType]);

  const acceptVendorRequest = useCallback(async (requestId) => {
    if (!token || !requestId) return;

    setVendorActionRequestId(requestId);
    try {
      const accepted = await acceptVendorRequestApi(token, requestId);
      await loadVendorData(token);
      addToast({
        type: 'success',
        title: 'Vendor updated',
        message: accepted?.name ? `${accepted.name} integration approved.` : 'Integration request approved.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Vendor action failed',
        message: error.message || 'Unable to approve the integration request.',
      });
    } finally {
      setVendorActionRequestId('');
    }
  }, [addToast, loadVendorData, token]);

  const rejectVendorRequest = useCallback(async (requestId) => {
    if (!token || !requestId) return;

    setVendorActionRequestId(requestId);
    try {
      const rejected = await rejectVendorRequestApi(token, requestId);
      await loadVendorData(token);
      addToast({
        type: 'success',
        title: 'Vendor updated',
        message: rejected?.name ? `${rejected.name} integration rejected.` : 'Integration request rejected.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Vendor action failed',
        message: error.message || 'Unable to reject the integration request.',
      });
    } finally {
      setVendorActionRequestId('');
    }
  }, [addToast, loadVendorData, token]);

  return {
    activeVendorPartners,
    focusedVendorRequest,
    loadVendorData,
    pendingVendorRequests,
    rejectVendorRequest,
    rejectedVendorRequests,
    selectedVendorRequestId,
    setSelectedVendorRequestId,
    acceptVendorRequest,
    vendorActionRequestId,
    vendorError,
    vendorLoading,
    vendorStats,
  };
}
