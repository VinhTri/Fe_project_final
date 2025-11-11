import React, { createContext, useContext, useMemo, useState } from "react";

const WalletDataContext = createContext(null);

export function WalletDataProvider({ children }) {
  // danh sách ví mẫu (tạm thời)
  const [wallets, setWallets] = useState([
    {
      walletId: 1,
      walletName: "Ví tiền mặt",
      balance: 2500000,
      currencyCode: "VND",
      description: "Chi tiêu hằng ngày",
      isDefault: true,
      userId: 7,
      createdAt: "2025-11-01T09:00:00Z",
      updatedAt: "2025-11-01T09:00:00Z",
    },
    {
      walletId: 2,
      walletName: "Techcombank",
      balance: 10000000,
      currencyCode: "VND",
      description: "Lương và tiết kiệm",
      isDefault: false,
      userId: 7,
      createdAt: "2025-11-02T08:30:00Z",
      updatedAt: "2025-11-02T08:30:00Z",
    },
    {
      walletId: 3,
      walletName: "Momo",
      balance: 1800000,
      currencyCode: "VND",
      description: "Ví điện tử",
      isDefault: false,
      userId: 7,
      createdAt: "2025-11-05T13:15:00Z",
      updatedAt: "2025-11-05T13:15:00Z",
    },
  ]);

  // nhóm ví (giữ nguyên)
  const [groups, setGroups] = useState([
    {
      id: 10,
      name: "Gia đình",
      description: "",
      walletIds: [],
      budgetWalletId: null,
      isDefault: false,
      createdAt: "2025-11-01T09:00:00Z",
    },
    {
      id: 11,
      name: "Đầu tư",
      description: "",
      walletIds: [],
      budgetWalletId: null,
      isDefault: false,
      createdAt: "2025-11-02T09:00:00Z",
    },
  ]);

  // ====== helpers ======

  // tạo ví mới
  const createWallet = async (payload) => {
    await new Promise((r) => setTimeout(r, 200));

    const newWallet = {
      walletId: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 7, // có thể lấy từ context đăng nhập
      ...payload,
    };

    setWallets((prev) => {
      let next = [newWallet, ...prev];
      if (newWallet.isDefault)
        next = next.map((w) =>
          w.walletId === newWallet.walletId ? w : { ...w, isDefault: false }
        );
      return next;
    });

    // nếu là ví nhóm
    if (newWallet.isShared && newWallet.groupId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === newWallet.groupId
            ? {
                ...g,
                walletIds: Array.from(
                  new Set([...(g.walletIds || []), newWallet.walletId])
                ),
              }
            : g
        )
      );
    }

    return newWallet;
  };

  // cập nhật ví
  const updateWallet = async (patch) => {
    await new Promise((r) => setTimeout(r, 150));
    setWallets((prev) =>
      prev.map((w) =>
        w.walletId === patch.walletId
          ? { ...w, ...patch, updatedAt: new Date().toISOString() }
          : w
      )
    );
    return patch;
  };

  // xóa ví
  const deleteWallet = async (walletId) => {
    await new Promise((r) => setTimeout(r, 150));
    setWallets((prev) => prev.filter((w) => w.walletId !== walletId));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        walletIds: (g.walletIds || []).filter((wid) => wid !== walletId),
        budgetWalletId: g.budgetWalletId === walletId ? null : g.budgetWalletId,
      }))
    );
  };

  // tạo nhóm
  const createGroup = async ({ name, description = "", isDefault = false }) => {
    await new Promise((r) => setTimeout(r, 200));
    const newGroup = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim(),
      walletIds: [],
      budgetWalletId: null,
      isDefault: !!isDefault,
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [
      newGroup,
      ...prev.map((g) => (isDefault ? { ...g, isDefault: false } : g)),
    ]);
    return newGroup;
  };

  // liên kết ví ngân sách vào nhóm
  const linkBudgetWallet = (groupId, walletId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const ensured = Array.from(new Set([...(g.walletIds || []), walletId]));
        return { ...g, walletIds: ensured, budgetWalletId: walletId };
      })
    );
    setWallets((prev) =>
      prev.map((w) =>
        w.walletId === walletId ? { ...w, isShared: true, groupId } : w
      )
    );
  };

  const value = useMemo(
    () => ({
      wallets,
      groups,
      createWallet,
      updateWallet,
      deleteWallet,
      createGroup,
      linkBudgetWallet,
    }),
    [wallets, groups]
  );

  return (
    <WalletDataContext.Provider value={value}>
      {children}
    </WalletDataContext.Provider>
  );
}

export function useWalletData() {
  const ctx = useContext(WalletDataContext);
  if (!ctx)
    throw new Error("useWalletData must be used within WalletDataProvider");
  return ctx;
}
