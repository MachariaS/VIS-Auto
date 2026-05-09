import { request } from './client';

export function register(
  baseUrl: string,
  body: { name: string; email: string; phone: string; accountType: string; password: string },
) {
  return request(baseUrl, '/auth/register', body);
}

export function login(
  baseUrl: string,
  body: { email: string; password: string },
) {
  return request(baseUrl, '/auth/login', body);
}

export function verifyOtp(
  baseUrl: string,
  body: { email: string; otp: string },
) {
  return request(baseUrl, '/auth/verify-otp', body);
}

export function resendOtp(baseUrl: string, email: string) {
  return request(baseUrl, '/auth/resend-otp', { email });
}

export function forgotPassword(baseUrl: string, email: string) {
  return request(baseUrl, '/auth/forgot-password', { email });
}

export function resetPassword(
  baseUrl: string,
  body: { token: string; newPassword: string },
) {
  return request(baseUrl, '/auth/reset-password', body);
}
