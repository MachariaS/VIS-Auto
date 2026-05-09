import { request } from './client';
import type { Notification } from '../types/notification';

export function listNotifications(baseUrl: string, token: string) {
  return request<Notification[]>(baseUrl, '/notifications', undefined, 'GET', token);
}

export function getUnreadCount(baseUrl: string, token: string) {
  return request<{ count: number }>(baseUrl, '/notifications/unread-count', undefined, 'GET', token);
}

export function markAsRead(baseUrl: string, token: string, notificationId: string) {
  return request(baseUrl, `/notifications/${notificationId}/read`, undefined, 'PATCH', token);
}

export function markAllRead(baseUrl: string, token: string) {
  return request(baseUrl, '/notifications/read-all', undefined, 'PATCH', token);
}
