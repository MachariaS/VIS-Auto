import type { User } from '../types/user';

export function mergeUniqueList(list: string[] = [], additions: string[] = []): string[] {
  return Array.from(new Set([...(list || []), ...(additions || [])])).filter(Boolean);
}

export function toVendorId(value = ''): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getDefaultProfile(user: Partial<User> | null | undefined) {
  return {
    account: {
      displayName: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      company: user?.accountType === 'provider' ? user?.name ?? '' : '',
      location: 'Nairobi, Kenya',
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      pushAlerts: true,
      marketing: false,
    },
    preferences: {
      theme: 'dark',
      language: 'English',
      compactMode: false,
      dispatch: {
        preferredFuelBrands: [] as string[],
        minProviderRating: 0,
        vehicleBrand: '',
        preferredNetworks: [] as string[],
        favouriteProviders: [] as string[],
      },
    },
    subscription: {
      plan: user?.accountType === 'provider' ? 'Provider Starter' : 'Driver Starter',
      status: 'Trial active',
      renewalDate: '2026-05-15',
      billingEmail: user?.email ?? '',
    },
    business: {
      brief: '',
      locations: [
        {
          branchName: 'Main Branch',
          address: 'Nairobi, Kenya',
          countryCode: 'KE',
          town: 'Nairobi',
          road: '',
          landmark: '',
          mapUrl: '',
          latitude: '',
          longitude: '',
        },
      ],
      offeredServices: ['General Service', 'Paint and Body Works'],
      supportedVehicleTypes: ['Sedan', 'SUV'],
      kyc: {
        kraPin: '',
        certificateOfIncorporation: '',
        businessPermitNumber: '',
        taxComplianceCertificate: '',
      },
      contacts: {
        primaryPhone: '',
        supportPhone: '',
        supportEmail: user?.email ?? '',
        website: '',
        whatsapp: '',
        instagram: '',
        facebook: '',
        linkedin: '',
        x: '',
      },
    },
    vendors: {
      requestPolicy: 'approval_required',
      pendingRequests: [] as any[],
      activePartners: [] as any[],
      rejectedRequests: [] as any[],
    },
  };
}

export function mergeProfileSettings(
  user: Partial<User> | null | undefined,
  ...sources: any[]
) {
  const baseProfile = getDefaultProfile(user);
  const normalizedSources = sources.filter(Boolean);

  return normalizedSources.reduce(
    (current: any, nextSource: any) => ({
      ...current,
      ...nextSource,
      account: {
        ...baseProfile.account,
        ...current.account,
        ...nextSource.account,
      },
      notifications: {
        ...baseProfile.notifications,
        ...current.notifications,
        ...nextSource.notifications,
      },
      preferences: {
        ...baseProfile.preferences,
        ...current.preferences,
        ...nextSource.preferences,
        dispatch: {
          ...baseProfile.preferences.dispatch,
          ...(current.preferences?.dispatch ?? {}),
          ...(nextSource.preferences?.dispatch ?? {}),
        },
      },
      subscription: {
        ...baseProfile.subscription,
        ...current.subscription,
        ...nextSource.subscription,
      },
      business: {
        ...baseProfile.business,
        ...current.business,
        ...nextSource.business,
        kyc: {
          ...baseProfile.business.kyc,
          ...current.business?.kyc,
          ...nextSource.business?.kyc,
        },
        contacts: {
          ...baseProfile.business.contacts,
          ...current.business?.contacts,
          ...nextSource.business?.contacts,
        },
        locations:
          nextSource.business?.locations?.length > 0
            ? nextSource.business.locations
            : current.business?.locations || baseProfile.business.locations,
        offeredServices: mergeUniqueList(
          baseProfile.business.offeredServices,
          nextSource.business?.offeredServices || current.business?.offeredServices,
        ),
        supportedVehicleTypes: mergeUniqueList(
          baseProfile.business.supportedVehicleTypes,
          nextSource.business?.supportedVehicleTypes || current.business?.supportedVehicleTypes,
        ),
      },
      vendors: {
        ...baseProfile.vendors,
        ...current.vendors,
        ...nextSource.vendors,
      },
    }),
    baseProfile,
  );
}
