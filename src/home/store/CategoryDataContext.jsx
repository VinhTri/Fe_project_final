import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { categoryAPI } from "../../services/api-client";

const CategoryDataContext = createContext(null);

// Helper để lấy userId từ localStorage
function getUserId() {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.userId || user.id || null;
    }
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }
  return null;
}

export function CategoryDataProvider({ children }) {
  // Expense categories
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories từ API (nếu có API endpoint)
  // Tạm thời giữ mock data, chờ API endpoint để lấy danh sách categories
  useEffect(() => {
    // TODO: Khi có API GET /categories, load từ đó
    // Hiện tại giữ mock data
    setExpenseCategories([
      { id: 1, name: "Ăn uống", description: "Cơm, nước, cafe, đồ ăn vặt" },
      { id: 2, name: "Di chuyển", description: "Xăng xe, gửi xe, phương tiện công cộng" },
      { id: 3, name: "Mua sắm", description: "Quần áo, giày dép, đồ dùng cá nhân" },
      { id: 4, name: "Hóa đơn", description: "Điện, nước, internet, điện thoại" },
      { id: 5, name: "Giải trí", description: "Xem phim, game, du lịch, hội họp bạn bè" },
    ]);
    setIncomeCategories([
      { id: 101, name: "Lương", description: "Lương chính hàng tháng" },
      { id: 102, name: "Thưởng", description: "Thưởng dự án, thưởng KPI" },
      { id: 103, name: "Bán hàng", description: "Bán đồ cũ, bán online" },
      { id: 104, name: "Lãi tiết kiệm", description: "Lãi ngân hàng, lãi đầu tư an toàn" },
      { id: 105, name: "Khác", description: "Các khoản thu nhập khác" },
    ]);
    setCategoriesLoading(false);
  }, []);

  // Create expense category
  const createExpenseCategory = useCallback(async (payload) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    }

    try {
      const response = await categoryAPI.createCategory(
        userId,
        payload.name,
        payload.icon || "default",
        1 // transactionTypeId: 1 = Chi tiêu
      );
      
      const newCategory = {
        id: response.categoryId,
        name: response.categoryName,
        description: payload.description || "",
        icon: response.icon,
      };
      setExpenseCategories((prev) => [newCategory, ...prev]);
      return newCategory;
    } catch (err) {
      console.error("Error creating expense category:", err);
      throw err;
    }
  }, []);

  // Create income category
  const createIncomeCategory = useCallback(async (payload) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    }

    try {
      const response = await categoryAPI.createCategory(
        userId,
        payload.name,
        payload.icon || "default",
        2 // transactionTypeId: 2 = Thu nhập
      );
      
      const newCategory = {
        id: response.categoryId,
        name: response.categoryName,
        description: payload.description || "",
        icon: response.icon,
      };
      setIncomeCategories((prev) => [newCategory, ...prev]);
      return newCategory;
    } catch (err) {
      console.error("Error creating income category:", err);
      throw err;
    }
  }, []);

  // Update expense category
  const updateExpenseCategory = useCallback(async (id, patch) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    }

    try {
      const response = await categoryAPI.updateCategory(
        id,
        userId,
        patch.name,
        patch.icon || "default",
        1 // transactionTypeId: 1 = Chi tiêu
      );
      
      const updatedCategory = {
        id: response.categoryId,
        name: response.categoryName,
        description: patch.description || "",
        icon: response.icon,
      };
      setExpenseCategories((prev) =>
        prev.map((c) => (c.id === id ? updatedCategory : c))
      );
      return updatedCategory;
    } catch (err) {
      console.error("Error updating expense category:", err);
      throw err;
    }
  }, []);

  // Update income category
  const updateIncomeCategory = useCallback(async (id, patch) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    }

    try {
      const response = await categoryAPI.updateCategory(
        id,
        userId,
        patch.name,
        patch.icon || "default",
        2 // transactionTypeId: 2 = Thu nhập
      );
      
      const updatedCategory = {
        id: response.categoryId,
        name: response.categoryName,
        description: patch.description || "",
        icon: response.icon,
      };
      setIncomeCategories((prev) =>
        prev.map((c) => (c.id === id ? updatedCategory : c))
      );
      return updatedCategory;
    } catch (err) {
      console.error("Error updating income category:", err);
      throw err;
    }
  }, []);

  // Delete expense category
  const deleteExpenseCategory = useCallback(async (id) => {
    try {
      await categoryAPI.deleteCategory(id);
      setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting expense category:", err);
      throw err;
    }
  }, []);

  // Delete income category
  const deleteIncomeCategory = useCallback(async (id) => {
    try {
      await categoryAPI.deleteCategory(id);
      setIncomeCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting income category:", err);
      throw err;
    }
  }, []);

  // Get category by name and type
  const getCategoryByName = useCallback(
    (name, type) => {
      const list = type === "expense" ? expenseCategories : incomeCategories;
      return list.find((c) => c.name === name);
    },
    [expenseCategories, incomeCategories]
  );

  const value = useMemo(
    () => ({
      expenseCategories,
      incomeCategories,
      createExpenseCategory,
      createIncomeCategory,
      updateExpenseCategory,
      updateIncomeCategory,
      deleteExpenseCategory,
      deleteIncomeCategory,
      getCategoryByName,
    }),
    [
      expenseCategories,
      incomeCategories,
      createExpenseCategory,
      createIncomeCategory,
      updateExpenseCategory,
      updateIncomeCategory,
      deleteExpenseCategory,
      deleteIncomeCategory,
      getCategoryByName,
    ]
  );

  return (
    <CategoryDataContext.Provider value={value}>
      {children}
    </CategoryDataContext.Provider>
  );
}

export function useCategoryData() {
  const ctx = useContext(CategoryDataContext);
  if (!ctx)
    throw new Error(
      "useCategoryData must be used within CategoryDataProvider"
    );
  return ctx;
}
