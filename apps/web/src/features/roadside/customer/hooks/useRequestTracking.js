import { useRequestTracking as coreUseRequestTracking } from '@vis/core';
import { API_BASE } from '../../../../shared/constants';

const SERVER_URL = API_BASE.replace('/api', '');

export default function useRequestTracking({ token, selectedRequest }) {
  return coreUseRequestTracking({
    baseUrl: API_BASE,
    serverUrl: SERVER_URL,
    token,
    selectedRequest,
  });
}
