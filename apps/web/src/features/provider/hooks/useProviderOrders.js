import { useMemo } from 'react';

export default function useProviderOrders({
  requests,
  orderHistoryTab,
  ordersFromDate,
  ordersToDate,
  selectedOrderId,
}) {
  const filteredProviderOrders = useMemo(() => {
    const fromDate = ordersFromDate ? new Date(`${ordersFromDate}T00:00:00`) : null;
    const toDate = ordersToDate ? new Date(`${ordersToDate}T23:59:59`) : null;

    return requests.filter((requestItem) => {
      const createdAt = new Date(requestItem.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;
      if (orderHistoryTab === 'active') {
        return requestItem.status !== 'completed' && requestItem.status !== 'cancelled';
      }
      if (orderHistoryTab === 'completed') return requestItem.status === 'completed';
      if (orderHistoryTab === 'cancelled') return requestItem.status === 'cancelled';
      return true;
    });
  }, [orderHistoryTab, ordersFromDate, ordersToDate, requests]);

  const selectedOrder =
    filteredProviderOrders.find((requestItem) => requestItem.id === selectedOrderId) ||
    filteredProviderOrders[0] ||
    null;

  const orderCounts = useMemo(
    () => ({
      all: requests.length,
      active: requests.filter(
        (requestItem) =>
          requestItem.status !== 'completed' && requestItem.status !== 'cancelled',
      ).length,
      completed: requests.filter((requestItem) => requestItem.status === 'completed').length,
      cancelled: requests.filter((requestItem) => requestItem.status === 'cancelled').length,
    }),
    [requests],
  );

  return {
    filteredProviderOrders,
    orderCounts,
    selectedOrder,
  };
}
