// src/home/store/CategoryDataContext.jsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { categoryAPI } from "../../services/categoryApi";

const CategoryDataContext = createContext(null);

export function CategoryDataProvider({ children }) {
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ===== Helper: map Category từ BE sang format FE đang dùng =====
  const mapCategory = (category) => {
    if (!category) return null;

    const typeName = category.transactionType?.typeName || "";
    const isSystemValue =
      category.isSystem !== undefined
        ? category.isSystem
        : category.system !== undefined
        ? category.system
        : false;
    const isSystemBool =
      isSystemValue === true ||
      isSystemValue === "true" ||
      String(isSystemValue).toLowerCase() === "true";

    return {
      id: category.categoryId,
      categoryId: category.categoryId,
      name: category.categoryName,
      categoryName: category.categoryName,
      description: category.description || "",
      icon: category.description || "default", // BE đang dùng description như icon
      transactionTypeId: category.transactionType?.typeId,
      isSystem: isSystemBool,
      raw: category,
    };
  };

  // ===== Load categories từ BE =====
  const loadCategories = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setExpenseCategories([]);
      setIncomeCategories([]);
      setCategoriesLoading(false);
      return;
    }

    setCategoriesLoading(true);
    try {
      console.log("CategoryDataContext: Loading categories...");
      const response = await categoryAPI.getMyCategories();
      console.log("CategoryDataContext: API response:", response);

      let categories = [];
      if (Array.isArray(response)) {
        categories = response;
      } else if (response && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response && Array.isArray(response.categories)) {
        categories = response.categories;
      } else {
        console.warn("CategoryDataContext: Unexpected response format:", response);
        setExpenseCategories([]);
        setIncomeCategories([]);
        setCategoriesLoading(false);
        return;
      }

      const expenseList = [];
      const incomeList = [];

      categories.forEach((cat) => {
        const mapped = mapCategory(cat);
        if (!mapped) return;

        const typeName = cat.transactionType?.typeName || "";
        const typeId = cat.transactionType?.typeId;

        if (typeName === "Chi tiêu" || typeId === 1) {
          expenseList.push(mapped);
        } else if (typeName === "Thu nhập" || typeId === 2) {
          incomeList.push(mapped);
        }
      });

      console.log(
        "CategoryDataContext: Expense:",
        expenseList.length,
        "Income:",
        incomeList.length
      );

      setExpenseCategories(expenseList);
      setIncomeCategories(incomeList);
    } catch (err) {
      console.error("Error loading categories:", err);
      setExpenseCategories([]);
      setIncomeCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // ===== Reload categories (dùng lại loadCategories) =====
  const reloadCategories = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  // ===== Effect: load khi mount + khi token thay đổi qua events =====
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setExpenseCategories([]);
      setIncomeCategories([]);
      setCategoriesLoading(false);
      return;
    }

    loadCategories();

    const handleUserChange = () => {
      const tokenNow = localStorage.getItem("accessToken");
      if (!tokenNow) {
        setExpenseCategories([]);
        setIncomeCategories([]);
        setCategoriesLoading(false);
      } else {
        loadCategories();
      }
    };
    window.addEventListener("userChanged", handleUserChange);

    const handleStorageChange = (e) => {
      if (["user", "auth_user", "accessToken"].includes(e.key)) {
        const tokenNow = localStorage.getItem("accessToken");
        if (!tokenNow) {
          setExpenseCategories([]);
          setIncomeCategories([]);
          setCategoriesLoading(false);
        } else {
          loadCategories();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("userChanged", handleUserChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadCategories]);

  // ===== CRUD: Create Expense Category =====
  const createExpenseCategory = useCallback(
    async (payload) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }

      try {
        const descriptionValue =
          (payload.description || payload.icon || "").trim() || null;

        const response = await categoryAPI.createCategory(
          payload.name,
          descriptionValue,
          1 // Chi tiêu
        );

        await reloadCategories();

        return mapCategory(response);
      } catch (err) {
        console.error("Error creating expense category:", err);
        throw err;
      }
    },
    [reloadCategories]
  );

  // ===== Create Income Category =====
  const createIncomeCategory = useCallback(
    async (payload) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }

      try {
        const descriptionValue =
          (payload.description || payload.icon || "").trim() || null;

        const response = await categoryAPI.createCategory(
          payload.name,
          descriptionValue,
          2 // Thu nhập
        );

        await reloadCategories();

        return mapCategory(response);
      } catch (err) {
        console.error("Error creating income category:", err);
        throw err;
      }
    },
    [reloadCategories]
  );

  // ===== Update Expense Category =====
  const updateExpenseCategory = useCallback(
    async (id, patch) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }

      try {
        const descriptionValue =
          (patch.description || patch.icon || "").trim() || null;

        const response = await categoryAPI.updateCategory(
          id,
          patch.name,
          descriptionValue
        );

        await reloadCategories();

        return mapCategory(response);
      } catch (err) {
        console.error("Error updating expense category:", err);
        throw err;
      }
    },
    [reloadCategories]
  );

  // ===== Update Income Category =====
  const updateIncomeCategory = useCallback(
    async (id, patch) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }

      try {
        const descriptionValue =
          (patch.description || patch.icon || "").trim() || null;

        const response = await categoryAPI.updateCategory(
          id,
          patch.name,
          descriptionValue
        );

        await reloadCategories();

        return mapCategory(response);
      } catch (err) {
        console.error("Error updating income category:", err);
        throw err;
      }
    },
    [reloadCategories]
  );

  // ===== Delete Expense Category =====
  const deleteExpenseCategory = useCallback(
    async (id) => {
      try {
        await categoryAPI.deleteCategory(id);
        setExpenseCategories((prev) =>
          prev.filter((c) => c.id !== id && c.categoryId !== id)
        );
        await reloadCategories();
      } catch (err) {
        console.error("Error deleting expense category:", err);
        await reloadCategories();
        throw err;
      }
    },
    [reloadCategories]
  );

  // ===== Delete Income Category =====
  const deleteIncomeCategory = useCallback(
    async (id) => {
      try {
        await categoryAPI.deleteCategory(id);
        setIncomeCategories((prev) =>
          prev.filter((c) => c.id !== id && c.categoryId !== id)
        );
        await reloadCategories();
      } catch (err) {
        console.error("Error deleting income category:", err);
        await reloadCategories();
        throw err;
      }
    },
    [reloadCategories]
  );

  // ===== Helper: lấy category theo tên + loại =====
  const getCategoryByName = useCallback(
    (name, type) => {
      const list = type === "expense" ? expenseCategories : incomeCategories;
      return list.find((c) => c.name === name || c.categoryName === name);
    },
    [expenseCategories, incomeCategories]
  );

  const value = useMemo(
    () => ({
      expenseCategories,
      incomeCategories,
      categoriesLoading,
      createExpenseCategory,
      createIncomeCategory,
      updateExpenseCategory,
      updateIncomeCategory,
      deleteExpenseCategory,
      deleteIncomeCategory,
      getCategoryByName,
      reloadCategories,
    }),
    [
      expenseCategories,
      incomeCategories,
      categoriesLoading,
      createExpenseCategory,
      createIncomeCategory,
      updateExpenseCategory,
      updateIncomeCategory,
      deleteExpenseCategory,
      deleteIncomeCategory,
      getCategoryByName,
      reloadCategories,
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
  if (!ctx) {
    throw new Error("useCategoryData must be used within CategoryDataProvider");
  }
  return ctx;
}
