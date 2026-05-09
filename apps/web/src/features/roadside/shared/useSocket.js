import { useSocket as coreUseSocket } from '@vis/core';
import { API_BASE } from '../../../shared/constants';

// Derive the raw server URL (strip /api suffix if present) for the socket namespace
const SERVER_URL = API_BASE.replace('/api', '');

export function useSocket(token) {
  return coreUseSocket(SERVER_URL, token);
}
