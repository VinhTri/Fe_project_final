import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  createWallet as createWalletAPI,
  getMyWallets,
  updateWallet as updateWalletAPI,
  deleteWallet as deleteWalletAPI,
  transferMoney as transferMoneyAPI,
  mergeWallets as mergeWalletsAPI,
  setDefaultWallet as setDefaultWalletAPI,
} from "../../services/wallet.service";
import { walletAPI } from "../../services/api-client";

const WalletDataContext = createContext(null);

export function WalletDataProvider({ children }) {
  // --- State ---
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nhóm ví (Mock data hoặc load từ API nếu có)
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

  // Màu mặc định cho ví
  const DEFAULT_WALLET_COLOR = "#2D99AE";

  // --- Effects ---

  // Load wallets từ API khi component mount hoặc khi user đăng nhập
  useEffect(() => {
    const loadWalletsIfToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await loadWallets();
      } else {
        setWallets([]);
        setLoading(false);
      }
    };

    // Load ngay khi mount
    loadWalletsIfToken();

    // Lắng nghe sự kiện custom khi user đăng nhập/đăng xuất (cùng tab)
    const handleUserChange = () => {
      loadWalletsIfToken();
    };
    window.addEventListener("userChanged", handleUserChange);

    // Lắng nghe sự kiện storage (đa tab)
    const handleStorageChange = (e) => {
      if (
        e.key === "accessToken" ||
        e.key === "user" ||
        e.key === "auth_user"
      ) {
        loadWalletsIfToken();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("userChanged", handleUserChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // --- Helpers ---

  // Normalize: Chuyển đổi dữ liệu API sang format chuẩn của App
  const normalizeWallet = (apiWallet, existingWallet = null) => {
    // Giữ lại color cũ hoặc dùng mặc định
    const preservedColor =
      apiWallet.color || existingWallet?.color || DEFAULT_WALLET_COLOR;

    // Xác định loại ví và trạng thái chia sẻ
    const walletType = apiWallet.walletType || apiWallet.type;
    const rawIsShared =
      walletType === "GROUP"
        ? true
        : walletType === "PERSONAL"
        ? false
        : apiWallet.isShared !== undefined
        ? apiWallet.isShared
        : existingWallet?.isShared || false;

    // Xử lý thông tin thành viên và role
    const resolvedMembersCount =
      apiWallet.totalMembers ??
      apiWallet.membersCount ??
      existingWallet?.membersCount ??
      0;
    const resolvedSharedEmails =
      apiWallet.sharedEmails || existingWallet?.sharedEmails || [];
    const resolvedRole = (
      apiWallet.walletRole ||
      apiWallet.role ||
      apiWallet.accessRole ||
      apiWallet.sharedRole ||
      existingWallet?.walletRole ||
      existingWallet?.sharedRole ||
      ""
    )
      .toString()
      .toUpperCase();

    const hasSharedMembers =
      resolvedMembersCount > 1 ||
      resolvedSharedEmails.length > 0 ||
      (resolvedRole &&
        !["", "OWNER", "MASTER", "ADMIN"].includes(resolvedRole));

    return {
      id: apiWallet.walletId || apiWallet.id,
      name: apiWallet.walletName || apiWallet.name,
      currency: apiWallet.currencyCode || apiWallet.currency,
      balance: apiWallet.balance || 0,
      type: walletType || "CASH",
      // Xử lý isDefault (backend có thể trả về 'default' thay vì 'isDefault')
      isDefault:
        apiWallet.isDefault !== undefined
          ? apiWallet.isDefault
          : apiWallet.default !== undefined
          ? apiWallet.default
          : false,
      isShared: rawIsShared,
      groupId: apiWallet.groupId || null,
      ownerUserId:
        apiWallet.ownerId ||
        apiWallet.ownerUserId ||
        apiWallet.createdBy ||
        existingWallet?.ownerUserId ||
        null,
      ownerName:
        apiWallet.ownerName ||
        apiWallet.ownerFullName ||
        existingWallet?.ownerName ||
        "",
      walletRole:
        apiWallet.walletRole ||
        apiWallet.role ||
        apiWallet.accessRole ||
        existingWallet?.walletRole ||
        null,
      sharedRole: apiWallet.sharedRole || existingWallet?.sharedRole || null,
      sharedEmails: resolvedSharedEmails,
      membersCount: resolvedMembersCount,
      hasSharedMembers,
      createdAt: apiWallet.createdAt,
      note: apiWallet.description || apiWallet.note || "",
      color: preservedColor,
      includeOverall: apiWallet.includeOverall !== false,
      includePersonal: apiWallet.includePersonal !== false,
      includeGroup: apiWallet.includeGroup !== false,
      txCount: apiWallet.transactionCount || apiWallet.txCount || 0,
      transactionCount: apiWallet.transactionCount || apiWallet.txCount || 0,
    };
  };

  const loadWallets = async () => {
    try {
      setLoading(true);
      const { response, data } = await getMyWallets();
      if (response.ok && data.wallets) {
        let normalizedWallets = [];
        setWallets((prev) => {
          normalizedWallets = data.wallets.map((apiWallet) => {
            const existingWallet = prev.find(
              (w) => w.id === (apiWallet.walletId || apiWallet.id)
            );
            return normalizeWallet(apiWallet, existingWallet);
          });
          return normalizedWallets;
        });
        return normalizedWallets;
      } else {
        console.error("Failed to load wallets:", data.error);
        return [];
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const createWallet = async (payload) => {
    try {
      const { response, data } = await createWalletAPI({
        walletName: payload.name,
        currencyCode: payload.currency || "VND",
        description: payload.note || "",
        setAsDefault: payload.isDefault || false,
        walletType: payload.isShared ? "GROUP" : "PERSONAL",
        color: payload.color || DEFAULT_WALLET_COLOR,
      });

      if (response.ok && data.wallet) {
        const newWallet = normalizeWallet(data.wallet);
        const finalWallet = {
          ...newWallet,
          color: payload.color || newWallet.color || DEFAULT_WALLET_COLOR,
        };

        setWallets((prev) => {
          let next = [finalWallet, ...prev];
          if (finalWallet.isDefault) {
            next = next.map((w) =>
              w.id === finalWallet.id ? w : { ...w, isDefault: false }
            );
          }
          return next;
        });

        // Liên kết vào group nếu cần (mock logic)
        if (finalWallet.isShared && finalWallet.groupId) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === finalWallet.groupId
                ? {
                    ...g,
                    walletIds: Array.from(
                      new Set([...(g.walletIds || []), finalWallet.id])
                    ),
                  }
                : g
            )
          );
        }
        return finalWallet;
      } else {
        throw new Error(data.error || "Không thể tạo ví");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  };

  const updateWallet = async (patch) => {
    try {
      const walletId = patch.id;
      const oldWallet = wallets.find((w) => w.id === walletId);

      // Logic xử lý default wallet
      const shouldSetDefault = patch.isDefault === true;
      const shouldUnsetDefault = patch.isDefault === false;
      const wasDefault = oldWallet?.isDefault || false;

      const updateData = {};

      if (patch.name !== undefined || patch.walletName !== undefined)
        updateData.walletName = patch.name || patch.walletName;
      if (patch.note !== undefined || patch.description !== undefined)
        updateData.description = patch.note || patch.description || "";
      if (patch.currency !== undefined || patch.currencyCode !== undefined)
        updateData.currencyCode = patch.currency || patch.currencyCode;
      if (patch.balance !== undefined) updateData.balance = patch.balance;

      if (shouldSetDefault) {
        updateData.setAsDefault = true;
      } else if (shouldUnsetDefault && wasDefault) {
        updateData.setAsDefault = false;
      }

      if (patch.walletType !== undefined) {
        updateData.walletType = patch.walletType;
      }

      if (patch.color !== undefined) {
        updateData.color =
          patch.color || oldWallet?.color || DEFAULT_WALLET_COLOR;
      }

      const { response, data } = await updateWalletAPI(walletId, updateData);

      if (response.ok && data.wallet) {
        const updatedWallet = normalizeWallet(data.wallet, oldWallet);
        const finalWallet = {
          ...updatedWallet,
          color:
            patch.color ||
            oldWallet?.color ||
            updatedWallet.color ||
            DEFAULT_WALLET_COLOR,
        };

        setWallets((prev) => {
          const updated = prev.map((w) =>
            w.id === walletId ? finalWallet : w
          );
          if (finalWallet.isDefault) {
            return updated.map((w) =>
              w.id === walletId ? w : { ...w, isDefault: false }
            );
          }
          return updated;
        });
        return finalWallet;
      } else {
        throw new Error(data.error || "Không thể cập nhật ví");
      }
    } catch (error) {
      console.error("Error updating wallet:", error);
      throw error;
    }
  };

  const deleteWallet = async (id) => {
    try {
      const { response, data } = await deleteWalletAPI(id);

      if (response.ok) {
        setWallets((prev) => prev.filter((w) => w.id !== id));
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            walletIds: (g.walletIds || []).filter((wid) => wid !== id),
            budgetWalletId: g.budgetWalletId === id ? null : g.budgetWalletId,
          }))
        );
        return data;
      } else {
        throw new Error(data.error || "Không thể xóa ví");
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      throw error;
    }
  };

  const transferMoney = async (transferData) => {
    try {
      const sourceId =
        transferData.sourceId ||
        transferData.sourceWalletId ||
        transferData.fromWalletId;
      const targetId =
        transferData.targetId ||
        transferData.targetWalletId ||
        transferData.toWalletId;

      const { response, data } = await transferMoneyAPI({
        fromWalletId: sourceId,
        toWalletId: targetId,
        amount: transferData.amount,
        targetCurrencyCode: transferData.targetCurrencyCode,
        note: transferData.note || transferData.description || "",
      });

      if (response.ok) {
        const updatedWallets = await loadWallets();
        const sourceWallet = updatedWallets.find((w) => w.id === sourceId);
        const targetWallet = updatedWallets.find((w) => w.id === targetId);

        return {
          ...data,
          sourceWallet,
          targetWallet,
        };
      } else {
        throw new Error(data.error || "Không thể chuyển tiền");
      }
    } catch (error) {
      console.error("Error transferring money:", error);
      throw error;
    }
  };

  const mergeWallets = async (mergeData) => {
    try {
      const { targetId, sourceId, keepCurrency, preview } = mergeData;
      const targetIdNum = Number(targetId);
      const sourceIdNum = Number(sourceId);

      if (isNaN(targetIdNum) || isNaN(sourceIdNum)) {
        throw new Error("ID ví không hợp lệ");
      }

      let targetCurrency;
      if (keepCurrency === "SOURCE") {
        targetCurrency = preview?.currency || mergeData.targetCurrency || "VND";
      } else {
        targetCurrency = mergeData.targetCurrency || "VND";
        if (preview?.currency) {
          targetCurrency = preview.currency;
        }
      }

      const { response, data } = await mergeWalletsAPI(targetIdNum, {
        sourceWalletId: sourceIdNum,
        targetCurrency: targetCurrency,
      });

      if (response.ok) {
        const updatedWallets = await loadWallets();
        const finalWallet = updatedWallets.find((w) => w.id === targetIdNum);
        return { ...data, finalWallet };
      } else {
        const errorMessage =
          data?.error ||
          data?.message ||
          `HTTP ${response.status}: Không thể gộp ví`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error merging wallets:", error);
      throw error;
    }
  };

  const convertToGroup = async (walletId) => {
    try {
      const walletIdNum = Number(walletId);
      if (isNaN(walletIdNum)) throw new Error("ID ví không hợp lệ");

      const currentWallet = wallets.find((w) => w.id === walletIdNum);
      if (!currentWallet) throw new Error("Không tìm thấy ví");

      const walletName = currentWallet.name || currentWallet.walletName;
      if (!walletName || walletName.trim() === "")
        throw new Error("Tên ví không được để trống");

      const data = await walletAPI.convertToGroupWallet(
        walletIdNum,
        walletName.trim()
      );

      // Nếu API trả về wallet ngay lập tức, cập nhật state tạm thời
      if (data?.wallet) {
        const normalizedFromResponse = normalizeWallet(
          data.wallet,
          currentWallet
        );
        setWallets((prev) =>
          prev.map((w) => (w.id === walletIdNum ? normalizedFromResponse : w))
        );
      }

      // Reload toàn bộ để đồng bộ
      const updatedWallets = await loadWallets();
      const updatedWallet = updatedWallets.find((w) => w.id === walletIdNum);

      return {
        ...data,
        wallet: updatedWallet,
      };
    } catch (error) {
      console.error("Error converting wallet:", error);
      throw error;
    }
  };

  const setDefaultWallet = async (walletId) => {
    try {
      const walletIdNum = Number(walletId);
      if (isNaN(walletIdNum)) throw new Error("ID ví không hợp lệ");

      const { response, data } = await setDefaultWalletAPI(walletIdNum);

      if (response.ok) {
        const updatedWallets = await loadWallets();
        const updatedWallet = updatedWallets.find((w) => w.id === walletIdNum);
        return { ...data, wallet: updatedWallet };
      } else {
        const errorMessage =
          data?.error ||
          data?.message ||
          `HTTP ${response.status}: Không thể đặt ví mặc định`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error setting default wallet:", error);
      throw error;
    }
  };

  // --- Group Helpers (Mock) ---
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
        w.id === walletId ? { ...w, isShared: true, groupId } : w
      )
    );
  };

  // --- Context Value ---
  const value = useMemo(
    () => ({
      wallets,
      groups,
      loading,
      createWallet,
      updateWallet,
      deleteWallet,
      setDefaultWallet,
      createGroup,
      linkBudgetWallet,
      transferMoney,
      mergeWallets,
      convertToGroup,
      loadWallets,
    }),
    [wallets, groups, loading]
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
