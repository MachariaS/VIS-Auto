import { useSocket as coreUseSocket } from '../../../../../../packages/core/src/hooks/useSocket';
import { API_BASE } from '../../../shared/constants';

const SERVER_URL = API_BASE.replace('/api', '');

export function useSocket(token) {
  return coreUseSocket(SERVER_URL, token);
}
