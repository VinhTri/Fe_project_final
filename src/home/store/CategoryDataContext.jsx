import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { 
  createCategory as createCategoryAPI,
  updateCategory as updateCategoryAPI,
  deleteCategory as deleteCategoryAPI,
  getAllCategories as getAllCategoriesAPI,
} from "../../services/category.service";

const CategoryDataContext = createContext(null);

export function CategoryDataProvider({ children }) {
  // Expense categories
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Helper: Normalize category data từ API format sang format dùng trong app
  const normalizeCategory = (apiCategory) => {
    return {
      id: apiCategory.categoryId || apiCategory.id,
      name: apiCategory.categoryName || apiCategory.name,
      description: apiCategory.description || "",
      icon: apiCategory.icon || "default",
      isSystem: apiCategory.isSystem || false,
      transactionTypeId: apiCategory.transactionType?.typeId || (apiCategory.transactionTypeId || 1),
    };
  };

  // Load categories từ API
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log("CategoryDataContext: Loading categories từ API");
      const { response, data } = await getAllCategoriesAPI();
      
      console.log("CategoryDataContext: API response:", { 
        ok: response.ok, 
        status: response.status,
        hasData: !!data,
        isArray: Array.isArray(data),
        categoryCount: Array.isArray(data) ? data.length : 0
      });
      
      if (response.ok && Array.isArray(data)) {
        const normalizedCategories = data.map(normalizeCategory);
        console.log("CategoryDataContext: Normalized categories:", normalizedCategories.length);
        
        // Tách expense và income categories
        const expense = normalizedCategories.filter(c => c.transactionTypeId === 1);
        const income = normalizedCategories.filter(c => c.transactionTypeId === 2);
        
        console.log("CategoryDataContext: Expense:", expense.length, "Income:", income.length);
        
        setExpenseCategories(expense);
        setIncomeCategories(income);
      } else {
        console.error("CategoryDataContext: Failed to load categories:", data?.error || "Unknown error");
        // Fallback to empty arrays nếu có lỗi
        setExpenseCategories([]);
        setIncomeCategories([]);
      }
    } catch (error) {
      console.error("CategoryDataContext: Error loading categories:", error);
      // Fallback to empty arrays nếu có lỗi
      setExpenseCategories([]);
      setIncomeCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load categories từ API khi component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Create expense category
  const createExpenseCategory = useCallback(async (payload) => {
    try {
      const categoryData = {
        categoryName: payload.name,
        description: payload.description || null,
        transactionTypeId: 1, // 1 = Chi tiêu
      };

      console.log("CategoryDataContext: Creating expense category:", categoryData);

      const { response, data } = await createCategoryAPI(categoryData);

      console.log("CategoryDataContext: Create API response:", { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (response.ok && data) {
        const newCategory = normalizeCategory(data);
        setExpenseCategories((prev) => [newCategory, ...prev]);
        return newCategory;
      } else {
        const errorMsg = data?.error || data?.message || (response.status === 500 ? "Lỗi máy chủ. Vui lòng thử lại sau." : "Không thể tạo danh mục");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error creating expense category:", error);
      throw error;
    }
  }, []);

  // Create income category
  const createIncomeCategory = useCallback(async (payload) => {
    try {
      const categoryData = {
        categoryName: payload.name,
        description: payload.description || null,
        transactionTypeId: 2, // 2 = Thu nhập
      };

      console.log("CategoryDataContext: Creating income category:", categoryData);

      const { response, data } = await createCategoryAPI(categoryData);

      console.log("CategoryDataContext: Create API response:", { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (response.ok && data) {
        const newCategory = normalizeCategory(data);
        setIncomeCategories((prev) => [newCategory, ...prev]);
        return newCategory;
      } else {
        const errorMsg = data?.error || data?.message || (response.status === 500 ? "Lỗi máy chủ. Vui lòng thử lại sau." : "Không thể tạo danh mục");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error creating income category:", error);
      throw error;
    }
  }, []);

  // Update expense category
  const updateExpenseCategory = useCallback(async (id, patch) => {
    try {
      const updateData = {
        categoryName: patch.name,
        description: patch.description || null,
      };

      console.log("CategoryDataContext: Updating expense category:", id, updateData);

      const { response, data } = await updateCategoryAPI(id, updateData);

      console.log("CategoryDataContext: Update API response:", { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (response.ok && data) {
        const updatedCategory = normalizeCategory(data);
        setExpenseCategories((prev) =>
          prev.map((c) => (c.id === id ? updatedCategory : c))
        );
        return updatedCategory;
      } else {
        const errorMsg = data?.error || data?.message || (response.status === 500 ? "Lỗi máy chủ. Vui lòng thử lại sau." : "Không thể cập nhật danh mục");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error updating expense category:", error);
      throw error;
    }
  }, []);

  // Update income category
  const updateIncomeCategory = useCallback(async (id, patch) => {
    try {
      const updateData = {
        categoryName: patch.name,
        description: patch.description || null,
      };

      console.log("CategoryDataContext: Updating income category:", id, updateData);

      const { response, data } = await updateCategoryAPI(id, updateData);

      console.log("CategoryDataContext: Update API response:", { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (response.ok && data) {
        const updatedCategory = normalizeCategory(data);
        setIncomeCategories((prev) =>
          prev.map((c) => (c.id === id ? updatedCategory : c))
        );
        return updatedCategory;
      } else {
        const errorMsg = data?.error || data?.message || (response.status === 500 ? "Lỗi máy chủ. Vui lòng thử lại sau." : "Không thể cập nhật danh mục");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error updating income category:", error);
      throw error;
    }
  }, []);

  // Delete expense category
  const deleteExpenseCategory = useCallback(async (id) => {
    try {
      console.log("CategoryDataContext: Deleting expense category:", id);

      const { response, data } = await deleteCategoryAPI(id);

      console.log("CategoryDataContext: Delete API response:", { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (response.ok) {
        setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
        return true;
      } else {
        const errorMsg = data?.error || data?.message || (response.status === 500 ? "Lỗi máy chủ. Vui lòng thử lại sau." : "Không thể xóa danh mục");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting expense category:", error);
      throw error;
    }
  }, []);

  // Delete income category
  const deleteIncomeCategory = useCallback(async (id) => {
    try {
      console.log("CategoryDataContext: Deleting income category:", id);

      const { response, data } = await deleteCategoryAPI(id);

      console.log("CategoryDataContext: Delete API response:", { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (response.ok) {
        setIncomeCategories((prev) => prev.filter((c) => c.id !== id));
        return true;
      } else {
        const errorMsg = data?.error || data?.message || (response.status === 500 ? "Lỗi máy chủ. Vui lòng thử lại sau." : "Không thể xóa danh mục");
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting income category:", error);
      throw error;
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
      categoriesLoading,
      createExpenseCategory,
      createIncomeCategory,
      updateExpenseCategory,
      updateIncomeCategory,
      deleteExpenseCategory,
      deleteIncomeCategory,
      getCategoryByName,
      loadCategories,
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
      loadCategories,
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
