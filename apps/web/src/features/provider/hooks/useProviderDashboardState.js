import { useReducer } from 'react';
import { initialProviderService } from '../../../shared/constants';

const initialState = {
  providerServices: [],
  requests: [],
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

function reducer(state, action) {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'patch':
      return { ...state, [action.key]: { ...state[action.key], ...action.value } };
    case 'resetProviderServiceForm':
      return { ...state, providerServiceForm: initialProviderService };
    default:
      return state;
  }
}

export default function useProviderDashboardState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  function setValue(key) {
    return (value) => {
      dispatch({
        type: 'set',
        key,
        value: typeof value === 'function' ? value(state[key]) : value,
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
    setSectionLoading: setValue('sectionLoading'),
    patchSectionLoading: (value) => dispatch({ type: 'patch', key: 'sectionLoading', value }),
    setSectionErrors: setValue('sectionErrors'),
    patchSectionErrors: (value) => dispatch({ type: 'patch', key: 'sectionErrors', value }),
  };
}
