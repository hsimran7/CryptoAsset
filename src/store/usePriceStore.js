import { create } from 'zustand';
import { io } from 'socket.io-client';

export const usePriceStore = create((set, get) => {
  let socketInstance = null;
  let flashTimeoutIds = {};

  return {
    prices: {
      bitcoin: { price: 60233.00, change24h: 0.02, lastPrice: 60233.00, status: 'same' },
      ethereum: { price: 3559.37, change24h: 0.23, lastPrice: 3559.37, status: 'same' },
      solana: { price: 149.82, change24h: 0.17, lastPrice: 149.82, status: 'same' },
      chainlink: { price: 13.45, change24h: -1.25, lastPrice: 13.45, status: 'same' },
      'fetch-ai': { price: 1.15, change24h: 3.42, lastPrice: 1.15, status: 'same' }
    },
    isConnected: false,

    connectSocket: () => {
      if (socketInstance) return;

      console.log('[Price Store] Connecting Socket.io client...');
      socketInstance = io('http://localhost:5000', {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000
      });

      socketInstance.on('connect', () => {
        console.log('[Price Store] Socket.io client connected. Real-time updates active.');
        set({ isConnected: true });
      });

      socketInstance.on('price-update', (updatedPrices) => {
        const currentPrices = get().prices;
        const nextPrices = { ...currentPrices };

        Object.keys(updatedPrices).forEach((id) => {
          if (nextPrices[id]) {
            const oldPrice = nextPrices[id].price;
            const newPrice = updatedPrices[id].price;

            let status = 'same';
            if (newPrice > oldPrice) {
              status = 'up';
            } else if (newPrice < oldPrice) {
              status = 'down';
            }

            nextPrices[id] = {
              price: newPrice,
              change24h: updatedPrices[id].change24h,
              lastPrice: oldPrice,
              status: status !== 'same' ? status : (nextPrices[id].status || 'same')
            };

            // If the price changed, schedule a reset of the status flash effect after 800ms
            if (status !== 'same') {
              if (flashTimeoutIds[id]) {
                clearTimeout(flashTimeoutIds[id]);
              }

              flashTimeoutIds[id] = setTimeout(() => {
                set((state) => {
                  const resetPrices = { ...state.prices };
                  if (resetPrices[id]) {
                    resetPrices[id] = {
                      ...resetPrices[id],
                      status: 'same'
                    };
                  }
                  return { prices: resetPrices };
                });
              }, 800);
            }
          }
        });

        set({ prices: nextPrices });
      });

      socketInstance.on('disconnect', () => {
        console.log('[Price Store] Socket.io client disconnected.');
        set({ isConnected: false });
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('[Price Store] Connection error:', err.message);
        set({ isConnected: false });
      });
    },

    disconnectSocket: () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        console.log('[Price Store] Socket.io client disconnected manually.');
      }
      Object.keys(flashTimeoutIds).forEach((id) => {
        clearTimeout(flashTimeoutIds[id]);
      });
      flashTimeoutIds = {};
      set({ isConnected: false });
    }
  };
});
