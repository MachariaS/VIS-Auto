import { request } from './client';

export function submitRating(
  baseUrl: string,
  token: string,
  requestId: string,
  body: { score: number; comment?: string },
) {
  return request(baseUrl, `/ratings/${requestId}`, body, 'POST', token);
}
