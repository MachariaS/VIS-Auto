import { useReducer } from 'react';
import { initialProviderService } from '../constants/forms';

const initialState = {
  providerServices: [] as any[],
  requests: [] as any[],
  providerServiceForm: initialProviderService,
  editingProviderServiceId: '',
  showProviderServiceComposer: false,
  orderHistoryTab: 'all',
  orderActionMenuId: '',
  selectedOrderId: '',
  ordersFromDate: '2026-04-01',
  ordersToDate: '2026-04-30',
  updatingOrderId: '',
  brandLogoError: false,
  loading: false,
  showNotifications: false,
  showAccountMenu: false,
  showMobileSidebar: false,
  sectionLoading: {
    overview: true,
    services: true,
    vendors: true,
    orders: true,
  },
  sectionErrors: {
    overview: '',
    services: '',
    vendors: '',
    orders: '',
  },
};

type State = typeof initialState;

type Action =
  | { type: 'set'; key: keyof State; value: any }
  | { type: 'patch'; key: keyof State; value: any }
  | { type: 'resetProviderServiceForm' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'patch':
      return { ...state, [action.key]: { ...(state[action.key] as any), ...action.value } };
    case 'resetProviderServiceForm':
      return { ...state, providerServiceForm: initialProviderService };
    default:
      return state;
  }
}

export function useProviderDashboardState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  function setValue<K extends keyof State>(key: K) {
    return (value: State[K] | ((prev: State[K]) => State[K])) => {
      dispatch({
        type: 'set',
        key,
        value: typeof value === 'function' ? (value as Function)(state[key]) : value,
      });
    };
  }

  return {
    ...state,
    setProviderServices: setValue('providerServices'),
    setRequests: setValue('requests'),
    setProviderServiceForm: setValue('providerServiceForm'),
    resetProviderServiceForm: () => dispatch({ type: 'resetProviderServiceForm' }),
    setEditingProviderServiceId: setValue('editingProviderServiceId'),
    setShowProviderServiceComposer: setValue('showProviderServiceComposer'),
    setOrderHistoryTab: setValue('orderHistoryTab'),
    setOrderActionMenuId: setValue('orderActionMenuId'),
    setSelectedOrderId: setValue('selectedOrderId'),
    setOrdersFromDate: setValue('ordersFromDate'),
    setOrdersToDate: setValue('ordersToDate'),
    setUpdatingOrderId: setValue('updatingOrderId'),
    setBrandLogoError: setValue('brandLogoError'),
    setLoading: setValue('loading'),
    setShowNotifications: setValue('showNotifications'),
    setShowAccountMenu: setValue('showAccountMenu'),
    setShowMobileSidebar: setValue('showMobileSidebar'),
    setSectionLoading: setValue('sectionLoading'),
    patchSectionLoading: (value: Partial<State['sectionLoading']>) =>
      dispatch({ type: 'patch', key: 'sectionLoading', value }),
    setSectionErrors: setValue('sectionErrors'),
    patchSectionErrors: (value: Partial<State['sectionErrors']>) =>
      dispatch({ type: 'patch', key: 'sectionErrors', value }),
  };
}
