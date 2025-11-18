// src/home/store/WalletDataContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

const WalletDataContext = createContext(null);

// Demo tỷ giá đơn giản cho merge + chuyển tiền
const RATE_USD_VND = 24350;
const convertAmount = (amount, from, to) => {
  if (!amount || from === to) return amount;

  if (from === "USD" && to === "VND") return amount * RATE_USD_VND;
  if (from === "VND" && to === "USD") return amount / RATE_USD_VND;

  // các cặp khác tạm giữ nguyên
  return amount;
};

export function WalletDataProvider({ children }) {
  // ví
  const [wallets, setWallets] = useState([
    {
      id: 1,
      name: "Ví tiền mặt",
      currency: "VND",
      balance: 2_500_000,
      type: "CASH",
      isDefault: true,
      isShared: false,
      groupId: null,
      createdAt: "2025-11-01T09:00:00Z",
      note: "",
      txCount: 15,
    },
    {
      id: 2,
      name: "Techcombank",
      currency: "VND",
      balance: 10_000_000,
      type: "BANK",
      isDefault: false,
      isShared: false,
      groupId: null,
      createdAt: "2025-11-02T08:30:00Z",
      note: "",
      txCount: 20,
    },
    {
      id: 3,
      name: "Momo",
      currency: "VND",
      balance: 1_800_000,
      type: "EWALLET",
      isDefault: false,
      isShared: false,
      groupId: null,
      createdAt: "2025-11-05T13:15:00Z",
      note: "",
      txCount: 10,
    },
  ]);

  // nhóm ví
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

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ====== helpers ======
  const createWallet = async (payload) => {
    // mock API
    await sleep(200);
    const newWallet = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      txCount: 0,
      ...payload,
    };

    setWallets((prev) => {
      let next = [newWallet, ...prev];
      // nếu đặt làm mặc định thì clear default của ví khác
      if (newWallet.isDefault) {
        next = next.map((w) =>
          w.id === newWallet.id ? w : { ...w, isDefault: false }
        );
      }
      return next;
    });

    // nếu là ví nhóm thì liên kết vào group
    if (newWallet.isShared && newWallet.groupId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === newWallet.groupId
            ? {
                ...g,
                walletIds: Array.from(
                  new Set([...(g.walletIds || []), newWallet.id])
                ),
              }
            : g
        )
      );
    }
    return newWallet;
  };

  // HỖ TRỢ 2 KIỂU GỌI:
  // updateWallet(patch)  HOẶC  updateWallet(id, patch)
  const updateWallet = async (idOrPatch, maybePatch) => {
    await sleep(150);

    // case: updateWallet(patch)
    if (
      typeof idOrPatch === "object" &&
      idOrPatch !== null &&
      !maybePatch &&
      idOrPatch.id != null
    ) {
      const patch = idOrPatch;
      setWallets((prev) =>
        prev.map((w) => (w.id === patch.id ? { ...w, ...patch } : w))
      );
      return patch;
    }

    // case: updateWallet(id, patch)
    const id = idOrPatch;
    const patch = maybePatch || {};
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
    return { id, ...patch };
  };

  const deleteWallet = async (id) => {
    await sleep(150);
    setWallets((prev) => prev.filter((w) => w.id !== id));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        walletIds: (g.walletIds || []).filter((wid) => wid !== id),
        budgetWalletId: g.budgetWalletId === id ? null : g.budgetWalletId,
      }))
    );
  };

  const createGroup = async ({ name, description = "", isDefault = false }) => {
    await sleep(200);
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

  const linkBudgetWallet = (groupId, walletId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const ensured = Array.from(
          new Set([...(g.walletIds || []), walletId])
        );
        return { ...g, walletIds: ensured, budgetWalletId: walletId };
      })
    );
    setWallets((prev) =>
      prev.map((w) =>
        w.id === walletId ? { ...w, isShared: true, groupId } : w
      )
    );
  };

  // ====== NẠP VÍ ======
  const depositToWallet = async (walletId, { amount, note, categoryId }) => {
    await sleep(150);
    const amt = Number(amount) || 0;

    setWallets((prev) =>
      prev.map((w) => {
        if (String(w.id) !== String(walletId)) return w;
        const currentBal = Number(w.balance ?? w.current ?? 0) || 0;
        return {
          ...w,
          balance: currentBal + amt,
          txCount: (w.txCount ?? 0) + 1,
        };
      })
    );

    // note, categoryId: sau này backend ghi transaction
  };

  // ====== RÚT VÍ ======
  const withdrawFromWallet = async (
    walletId,
    { amount, note, categoryId }
  ) => {
    await sleep(150);
    const amt = Number(amount) || 0;

    setWallets((prev) =>
      prev.map((w) => {
        if (String(w.id) !== String(walletId)) return w;
        const currentBal = Number(w.balance ?? w.current ?? 0) || 0;
        return {
          ...w,
          balance: currentBal - amt,
          txCount: (w.txCount ?? 0) + 1,
        };
      })
    );
  };

  // ====== CHUYỂN TIỀN GIỮA CÁC VÍ ======
  const transferBetweenWallets = async ({
    sourceId,
    targetId,
    amount,
    note,
    categoryId,
  }) => {
    await sleep(150);
    const amt = Number(amount) || 0;

    setWallets((prev) => {
      const source = prev.find((w) => String(w.id) === String(sourceId));
      const target = prev.find((w) => String(w.id) === String(targetId));
      if (!source || !target) return prev;

      const srcCur = source.currency || "VND";
      const tgtCur = target.currency || "VND";

      const srcBal = Number(source.balance ?? source.current ?? 0) || 0;
      const tgtBal = Number(target.balance ?? target.current ?? 0) || 0;

      const amountToTarget =
        srcCur === tgtCur ? amt : convertAmount(amt, srcCur, tgtCur);

      return prev.map((w) => {
        if (String(w.id) === String(sourceId)) {
          return {
            ...w,
            balance: srcBal - amt,
            txCount: (w.txCount ?? 0) + 1,
          };
        }
        if (String(w.id) === String(targetId)) {
          return {
            ...w,
            balance: tgtBal + amountToTarget,
            txCount: (w.txCount ?? 0) + 1,
          };
        }
        return w;
      });
    });
  };

  // ====== GỘP VÍ ======
  const mergeWallets = async ({
    sourceWalletId,
    targetWalletId,
    currencyMode = "keepTarget",
    categoryId,
  }) => {
    await sleep(200);

    setWallets((prev) => {
      const source = prev.find(
        (w) => String(w.id) === String(sourceWalletId)
      );
      const target = prev.find(
        (w) => String(w.id) === String(targetWalletId)
      );
      if (!source || !target) return prev;

      const srcBal = Number(source.balance ?? source.current ?? 0) || 0;
      const tgtBal = Number(target.balance ?? target.current ?? 0) || 0;

      const srcCur = source.currency || "VND";
      const tgtCur = target.currency || "VND";

      let finalCurrency;
      let finalBalance;

      if (srcCur === tgtCur) {
        // cùng loại tiền
        finalCurrency = tgtCur;
        finalBalance = srcBal + tgtBal;
      } else if (currencyMode === "keepSource") {
        // giữ loại tiền của ví nguồn
        const tgtConverted = convertAmount(tgtBal, tgtCur, srcCur);
        finalCurrency = srcCur;
        finalBalance = srcBal + tgtConverted;
      } else {
        // mặc định: giữ loại tiền ví đích
        const srcConverted = convertAmount(srcBal, srcCur, tgtCur);
        finalCurrency = tgtCur;
        finalBalance = tgtBal + srcConverted;
      }

      const totalTx =
        (source.txCount ?? 0) + (target.txCount ?? 0);

      return prev
        // xoá ví nguồn
        .filter((w) => String(w.id) !== String(sourceWalletId))
        // cập nhật ví đích
        .map((w) =>
          String(w.id) === String(targetWalletId)
            ? {
                ...w,
                balance: finalBalance,
                currency: finalCurrency,
                txCount: totalTx,
              }
            : w
        );
    });

    // Xoá liên kết ví nguồn trong nhóm (nếu có)
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        walletIds: (g.walletIds || []).filter(
          (wid) => String(wid) !== String(sourceWalletId)
        ),
        budgetWalletId:
          String(g.budgetWalletId) === String(sourceWalletId)
            ? null
            : g.budgetWalletId,
      }))
    );

    // categoryId: để dành cho backend log transaction gộp
  };

  const value = useMemo(
    () => ({
      wallets,
      groups,
      setWallets, // nếu bạn cần chỉnh trực tiếp chỗ khác
      createWallet,
      updateWallet,
      deleteWallet,
      createGroup,
      linkBudgetWallet,
      // mới thêm:
      depositToWallet,
      withdrawFromWallet,
      transferBetweenWallets,
      mergeWallets,
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
