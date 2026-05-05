// Store/rewardStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const REWARD_THRESHOLD = 100_000; // ₹1,00,000 — rupees (matches grandTotal / 100 from order page)
export const REWARD_RATE      = 0.005;   // 0.5%

export type RewardEntry = {
  id:         string;
  orderId:    string;
  dealerId:   string;
  dealerName: string;
  orderTotal: number; // ₹ rupees
  points:     number; // ₹ reward value
  status:     "active" | "cancelled";
  createdAt:  string; // ISO
};

export type DealerRewardSummary = {
  dealerId:     string;
  dealerName:   string;
  totalPoints:  number;
  activeOrders: number;
  entries:      RewardEntry[];
};

type RewardStore = {
  entries: RewardEntry[];
  addReward: (p: {
    orderId:    string;
    dealerId:   string;
    dealerName: string;
    orderTotal: number; // ₹ rupees
  }) => RewardEntry | null;
  cancelReward:    (orderId:  string) => void;
  getDealerPoints: (dealerId: string) => number;
  getAllSummaries:  ()                 => DealerRewardSummary[];
  clearDealer:     (dealerId: string) => void;
};

export const useRewardStore = create<RewardStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addReward: ({ orderId, dealerId, dealerName, orderTotal }) => {
        if (orderTotal < REWARD_THRESHOLD) return null;
        if (get().entries.find(e => e.orderId === orderId)) return null; // no duplicates
        const points: number = Math.round(orderTotal * REWARD_RATE);
        const entry: RewardEntry = {
          id:         `rwd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          orderId, dealerId, dealerName, orderTotal, points,
          status:    "active",
          createdAt: new Date().toISOString(),
        };
        set(s => ({ entries: [entry, ...s.entries] }));
        return entry;
      },

      cancelReward: (orderId) =>
        set(s => ({
          entries: s.entries.map(e =>
            e.orderId === orderId ? { ...e, status: "cancelled" as const } : e
          ),
        })),

      getDealerPoints: (dealerId) =>
        get().entries
          .filter(e => e.dealerId === dealerId && e.status === "active")
          .reduce((sum, e) => sum + e.points, 0),

      getAllSummaries: () => {
        const map: Record<string, DealerRewardSummary> = {};
        for (const e of get().entries) {
          if (!map[e.dealerId]) {
            map[e.dealerId] = {
              dealerId:     e.dealerId,
              dealerName:   e.dealerName,
              totalPoints:  0,
              activeOrders: 0,
              entries:      [],
            };
          }
          if (e.status === "active") {
            map[e.dealerId].totalPoints  += e.points;
            map[e.dealerId].activeOrders += 1;
          }
          map[e.dealerId].entries.push(e);
        }
        return Object.values(map).sort((a, b) => b.totalPoints - a.totalPoints);
      },

      clearDealer: (dealerId) =>
        set(s => ({ entries: s.entries.filter(e => e.dealerId !== dealerId) })),
    }),
    { name: "omsons-rewards-v1" }
  )
);