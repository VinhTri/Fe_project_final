import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  getMyWallets,
  createWallet as createWalletAPI,
  updateWallet as updateWalletAPI,
  deleteWallet as deleteWalletAPI,
  setDefaultWallet,
} from "../../services/wallet.service";

const WalletDataContext = createContext(null);

/**
 * Helper: Map backend wallet format to frontend format
 * Backend có thể trả về Wallet entity hoặc SharedWalletDTO với các field khác nhau
 */
const mapBackendToFrontend = (backendWallet) => {
  // Log để debug
  if (!backendWallet) {
    console.warn(
      "WalletDataContext: mapBackendToFrontend nhận null/undefined wallet"
    );
    return null;
  }

  // Backend có thể dùng walletId hoặc id, walletName hoặc name
  const walletId = backendWallet.walletId || backendWallet.id;
  const walletName = backendWallet.walletName || backendWallet.name;
  const currencyCode = backendWallet.currencyCode || backendWallet.currency;
  const description = backendWallet.description || backendWallet.note || "";

  if (!walletId) {
    console.warn("WalletDataContext: Wallet không có ID:", backendWallet);
  }

  // Xử lý isDefault: Backend có thể trả về 'isDefault' hoặc 'default' (do Java boolean getter isDefault())
  let isDefaultValue = false;
  if (backendWallet.isDefault !== undefined) {
    isDefaultValue = Boolean(backendWallet.isDefault);
  } else if (backendWallet.default !== undefined) {
    isDefaultValue = Boolean(backendWallet.default);
  }

  const mapped = {
    id: walletId,
    name: walletName || "Unnamed Wallet",
    currency: currencyCode || "VND",
    balance: backendWallet.balance || 0,
    type: backendWallet.type || backendWallet.walletType || "CASH",
    isDefault: isDefaultValue,
    isShared: backendWallet.isShared || false,
    groupId: backendWallet.groupId || null,
    createdAt: backendWallet.createdAt || new Date().toISOString(),
    note: description,
    includeOverall: true,
    includePersonal: true,
    includeGroup: true,
    color: backendWallet.color || null,
  };

  // Debug log để kiểm tra mapping
  if (isDefaultValue) {
    console.log("WalletDataContext: Mapped wallet với isDefault=true:", {
      walletId,
      walletName,
      backendIsDefault: backendWallet.isDefault,
      backendDefault: backendWallet.default,
      mappedIsDefault: mapped.isDefault,
    });
  }

  return mapped;
};

export function WalletDataProvider({ children }) {
  // ví
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // nhóm ví (tạm thời giữ nguyên mock data, sẽ implement API sau)
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

  // ====== Load wallets from API ======
  const loadWallets = async () => {
    try {
      setLoading(true);
      console.log("WalletDataContext: Bắt đầu load wallets từ API...");
      const { response, data } = await getMyWallets();
      console.log("WalletDataContext: API Response:", { response, data });

      if (response.ok && data.wallets) {
        console.log("WalletDataContext: Raw wallets từ API:", data.wallets);
        const mappedWallets = data.wallets
          .map(mapBackendToFrontend)
          .filter((w) => w !== null); // Filter out null wallets
        console.log("WalletDataContext: Mapped wallets:", mappedWallets);
        setWallets(mappedWallets);
      } else {
        console.error("WalletDataContext: Error loading wallets:", {
          ok: response.ok,
          status: response.status,
          error: data.error,
          data: data,
        });
        // Fallback to empty array on error
        setWallets([]);
      }
    } catch (error) {
      console.error("WalletDataContext: Exception khi load wallets:", error);
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  // ====== helpers ======
  const createWallet = async (payload) => {
    try {
      // Map frontend payload to backend format
      const backendPayload = {
        walletName: payload.name,
        currencyCode: payload.currency,
        description: payload.note || "",
        setAsDefault: payload.isDefault || false,
      };

      console.log(
        "WalletDataContext: Creating wallet với payload:",
        backendPayload
      );
      const { response, data } = await createWalletAPI(backendPayload);
      console.log("WalletDataContext: Create wallet response:", {
        response,
        data,
      });

      if (response.ok && data.wallet) {
        console.log("WalletDataContext: Raw created wallet:", data.wallet);
        const newWallet = mapBackendToFrontend(data.wallet);
        console.log("WalletDataContext: Mapped created wallet:", newWallet);
        // Merge với các field frontend-specific như color, include flags, etc.
        const mergedWallet = {
          ...newWallet,
          color: payload.color || newWallet.color,
          includeOverall:
            payload.includeOverall !== undefined
              ? payload.includeOverall
              : true,
          includePersonal:
            payload.includePersonal !== undefined
              ? payload.includePersonal
              : true,
          includeGroup:
            payload.includeGroup !== undefined ? payload.includeGroup : true,
          type: payload.type || newWallet.type,
          isShared: payload.isShared || false,
          groupId: payload.groupId || null,
        };

        setWallets((prev) => {
          let next = [mergedWallet, ...prev];
          // Nếu là ví mặc định, bỏ mặc định của các ví khác cùng currency
          if (mergedWallet.isDefault) {
            next = next.map((w) =>
              w.id === mergedWallet.id || w.currency !== mergedWallet.currency
                ? w
                : { ...w, isDefault: false }
            );
          }
          return next;
        });

        // Nếu là ví nhóm thì liên kết vào group
        if (mergedWallet.isShared && mergedWallet.groupId) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === mergedWallet.groupId
                ? {
                    ...g,
                    walletIds: Array.from(
                      new Set([...(g.walletIds || []), mergedWallet.id])
                    ),
                  }
                : g
            )
          );
        }

        return mergedWallet;
      } else {
        const errorMsg = data.error || "Tạo ví thất bại";
        console.error("WalletDataContext: Create wallet failed:", {
          ok: response.ok,
          status: response.status,
          error: errorMsg,
          data: data,
        });
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("WalletDataContext: Exception khi tạo wallet:", error);
      throw error;
    }
  };

  const updateWallet = async (patch) => {
    try {
      const walletId = patch.id;
      const shouldSetDefault = patch.isDefault === true;
      const shouldUnsetDefault = patch.isDefault === false;
      const wasDefault = wallets.find(w => w.id === walletId)?.isDefault || false;

      // Map frontend patch to backend format
      const backendPayload = {};
      if (patch.name !== undefined) backendPayload.walletName = patch.name;
      if (patch.currency !== undefined)
        backendPayload.currencyCode = patch.currency;
      if (patch.note !== undefined) backendPayload.description = patch.note;
      
      // Xử lý set/unset default wallet
      if (shouldSetDefault) {
        // QUAN TRỌNG: Luôn gửi setAsDefault = true trong updateWalletAPI để đảm bảo backend cập nhật đúng
        // Không cần gọi setDefaultWallet API riêng nữa, vì updateWalletAPI sẽ xử lý
        backendPayload.setAsDefault = true;
      } else if (shouldUnsetDefault && wasDefault) {
        // Nếu bỏ tích ví mặc định (và đang là default), gửi setAsDefault = false trong updateWalletAPI
        backendPayload.setAsDefault = false;
      }

      // Gọi API update nếu có thay đổi (name, currency, note, balance, hoặc setAsDefault/unsetDefault)
      // QUAN TRỌNG: Luôn gọi API update nếu có thay đổi, kể cả khi ví đã là mặc định
      if (Object.keys(backendPayload).length > 0 || patch.balance !== undefined || shouldSetDefault || shouldUnsetDefault) {
        const { response, data } = await updateWalletAPI(
          walletId,
          backendPayload
        );

        if (response.ok && data.wallet) {
          const updatedWallet = mapBackendToFrontend(data.wallet);
          // Merge với các field frontend-specific
          // QUAN TRỌNG: Ưu tiên dữ liệu từ database (updatedWallet), chỉ giữ các field frontend-specific từ patch
          const mergedWallet = {
            ...updatedWallet, // Dữ liệu từ database (name, currency, note, balance, isDefault đã được cập nhật)
            // Chỉ giữ các field frontend-specific không có trong database
            color: patch.color !== undefined ? patch.color : updatedWallet.color,
            includeOverall: patch.includeOverall !== undefined ? patch.includeOverall : updatedWallet.includeOverall,
            includePersonal: patch.includePersonal !== undefined ? patch.includePersonal : updatedWallet.includePersonal,
            includeGroup: patch.includeGroup !== undefined ? patch.includeGroup : updatedWallet.includeGroup,
            // Đảm bảo isDefault được giữ đúng từ database (đã được cập nhật bởi setDefaultWallet nếu cần)
            isDefault: updatedWallet.isDefault, // Luôn dùng giá trị từ database
          };

          // Update state
          setWallets((prev) => {
            if (shouldSetDefault && !wasDefault) {
              // Nếu mới set default, bỏ default của tất cả ví khác
              return prev.map((w) => 
                w.id === walletId ? mergedWallet : { ...w, isDefault: false }
              );
            } else if (shouldUnsetDefault && wasDefault) {
              // Nếu bỏ tích ví mặc định, chỉ update ví này
              return prev.map((w) => (w.id === walletId ? mergedWallet : w));
            } else {
              // Chỉ update ví này (giữ nguyên isDefault của các ví khác)
              return prev.map((w) => (w.id === walletId ? mergedWallet : w));
            }
          });
          return mergedWallet;
        } else {
          throw new Error(data.error || "Cập nhật ví thất bại");
        }
      } else {
        // Nếu chỉ set/unset default mà không có thay đổi khác
        if (shouldSetDefault) {
          // Nếu chỉ set default, cần gọi API update với setAsDefault = true
          // (kể cả khi đã gọi setDefaultWallet API, để đảm bảo database được cập nhật đúng)
          const { response, data } = await updateWalletAPI(walletId, { setAsDefault: true });
          if (response.ok && data.wallet) {
            const updatedWallet = mapBackendToFrontend(data.wallet);
            const mergedWallet = {
              ...updatedWallet,
              color: patch.color !== undefined ? patch.color : updatedWallet.color,
              includeOverall: patch.includeOverall !== undefined ? patch.includeOverall : updatedWallet.includeOverall,
              includePersonal: patch.includePersonal !== undefined ? patch.includePersonal : updatedWallet.includePersonal,
              includeGroup: patch.includeGroup !== undefined ? patch.includeGroup : updatedWallet.includeGroup,
              isDefault: updatedWallet.isDefault,
            };
            // Update state: bỏ default của tất cả ví khác
            setWallets((prev) =>
              prev.map((w) => (w.id === walletId ? mergedWallet : { ...w, isDefault: false }))
            );
            return mergedWallet;
          } else {
            throw new Error(data.error || "Đặt ví mặc định thất bại");
          }
        } else if (shouldUnsetDefault && wasDefault) {
          // Nếu chỉ bỏ tích ví mặc định, cần gọi API update với setAsDefault = false
          const { response, data } = await updateWalletAPI(walletId, { setAsDefault: false });
          if (response.ok && data.wallet) {
            const updatedWallet = mapBackendToFrontend(data.wallet);
            const mergedWallet = {
              ...updatedWallet,
              color: patch.color !== undefined ? patch.color : updatedWallet.color,
              includeOverall: patch.includeOverall !== undefined ? patch.includeOverall : updatedWallet.includeOverall,
              includePersonal: patch.includePersonal !== undefined ? patch.includePersonal : updatedWallet.includePersonal,
              includeGroup: patch.includeGroup !== undefined ? patch.includeGroup : updatedWallet.includeGroup,
              isDefault: updatedWallet.isDefault,
            };
            // Update state
            setWallets((prev) =>
              prev.map((w) => (w.id === walletId ? mergedWallet : w))
            );
            return mergedWallet;
          } else {
            throw new Error(data.error || "Bỏ ví mặc định thất bại");
          }
        } else {
          // Chỉ update local state nếu không có thay đổi backend và trả về wallet đã cập nhật
          let updatedWallet = null;
          setWallets((prev) => {
            const currentWallet = prev.find(w => w.id === walletId);
            updatedWallet = currentWallet ? { ...currentWallet, ...patch } : { ...patch };
            return prev.map((w) => (w.id === walletId ? updatedWallet : w));
          });
          return updatedWallet || { ...patch };
        }
      }
    } catch (error) {
      console.error("Error updating wallet:", error);
      // Fallback: update local state anyway
      setWallets((prev) =>
        prev.map((w) => (w.id === patch.id ? { ...w, ...patch } : w))
      );
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
      } else {
        throw new Error(data.error || "Xóa ví thất bại");
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      throw error;
    }
  };

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

  const value = useMemo(
    () => ({
      wallets,
      groups,
      loading,
      createWallet,
      updateWallet,
      deleteWallet,
      createGroup,
      linkBudgetWallet,
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
