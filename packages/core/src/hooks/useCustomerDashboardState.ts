import { useReducer } from 'react';
import { initialRoadsideRequest, initialVehicle } from '../constants/forms';

const initialState = {
  vehicles: [] as any[],
  requests: [] as any[],
  providerCatalog: [] as any[],
  vehicleForm: initialVehicle,
  roadsideForm: initialRoadsideRequest,
  serviceFilter: 'towing',
  loading: false,
  showNotifications: false,
  showAccountMenu: false,
  showMobileSidebar: false,
  sectionLoading: {
    overview: true,
    request: true,
    vehicles: true,
    history: true,
  },
  sectionErrors: {
    overview: '',
    request: '',
    vehicles: '',
    history: '',
  },
};

type State = typeof initialState;

type Action =
  | { type: 'set'; key: keyof State; value: any }
  | { type: 'patch'; key: keyof State; value: any }
  | { type: 'resetVehicleForm' }
  | { type: 'resetRoadsideForm'; vehicleId?: string; providerServiceId?: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'patch':
      return { ...state, [action.key]: { ...(state[action.key] as any), ...action.value } };
    case 'resetVehicleForm':
      return { ...state, vehicleForm: initialVehicle };
    case 'resetRoadsideForm':
      return {
        ...state,
        roadsideForm: {
          ...initialRoadsideRequest,
          vehicleId: action.vehicleId ?? state.roadsideForm.vehicleId,
          providerServiceId: action.providerServiceId ?? state.roadsideForm.providerServiceId,
        },
      };
    default:
      return state;
  }
}

export function useCustomerDashboardState() {
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
    setVehicles: setValue('vehicles'),
    setRequests: setValue('requests'),
    setProviderCatalog: setValue('providerCatalog'),
    setVehicleForm: setValue('vehicleForm'),
    resetVehicleForm: () => dispatch({ type: 'resetVehicleForm' }),
    setRoadsideForm: setValue('roadsideForm'),
    resetRoadsideForm: (value?: { vehicleId?: string; providerServiceId?: string }) =>
      dispatch({ type: 'resetRoadsideForm', ...value }),
    setServiceFilter: setValue('serviceFilter'),
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
