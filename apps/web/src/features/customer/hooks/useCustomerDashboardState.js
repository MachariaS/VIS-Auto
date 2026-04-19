import { useReducer } from 'react';
import { initialRoadsideRequest, initialVehicle } from '../../../shared/constants';

const initialState = {
  vehicles: [],
  requests: [],
  providerCatalog: [],
  vehicleForm: initialVehicle,
  roadsideForm: initialRoadsideRequest,
  serviceFilter: 'battery_jump',
  loading: false,
  showNotifications: false,
  showAccountMenu: false,
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

function reducer(state, action) {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'patch':
      return { ...state, [action.key]: { ...state[action.key], ...action.value } };
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

export default function useCustomerDashboardState() {
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
    setVehicles: setValue('vehicles'),
    setRequests: setValue('requests'),
    setProviderCatalog: setValue('providerCatalog'),
    setVehicleForm: setValue('vehicleForm'),
    resetVehicleForm: () => dispatch({ type: 'resetVehicleForm' }),
    setRoadsideForm: setValue('roadsideForm'),
    resetRoadsideForm: (value) => dispatch({ type: 'resetRoadsideForm', ...value }),
    setServiceFilter: setValue('serviceFilter'),
    setLoading: setValue('loading'),
    setShowNotifications: setValue('showNotifications'),
    setShowAccountMenu: setValue('showAccountMenu'),
    setSectionLoading: setValue('sectionLoading'),
    patchSectionLoading: (value) => dispatch({ type: 'patch', key: 'sectionLoading', value }),
    setSectionErrors: setValue('sectionErrors'),
    patchSectionErrors: (value) => dispatch({ type: 'patch', key: 'sectionErrors', value }),
  };
}
