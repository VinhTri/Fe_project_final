/**
 * File Service - Service layer cho các API calls liên quan đến file upload
 * Base URL: http://localhost:8080/files
 */

const API_BASE_URL = "http://localhost:8080";

/**
 * Upload file (ảnh hóa đơn, avatar, etc.)
 * @param {File} file - File cần upload (required)
 * @param {string} type - Loại file: "receipt" (ảnh hóa đơn), "avatar" (ảnh đại diện), mặc định là "receipt" (optional)
 * @returns {Promise<{message: string, url: string, filename: string, originalFilename: string, size: number, contentType: string}>}
 */
export const uploadFile = async (file, type = 'receipt') => {
  if (!file) {
    throw new Error('File không được để trống');
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Vui lòng chọn file ảnh (jpg, png, gif, etc.)");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("Kích thước file không được vượt quá 5MB");
  }

  // Tạo FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  // Lấy token từ localStorage
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  try {
    console.log("file.service: Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadType: type
    });

    // Gọi API upload
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Không set Content-Type, browser sẽ tự động set với boundary cho FormData
      },
      body: formData,
    });

    const data = await response.json();

    console.log("file.service: Upload response:", {
      ok: response.ok,
      status: response.status,
      data: data
    });

    if (!response.ok) {
      throw new Error(data.error || 'Upload file thất bại');
    }

    return {
      response: {
        ok: true,
        status: response.status,
        statusText: response.statusText,
      },
      data: data
    };
  } catch (error) {
    console.error("file.service: Upload error:", error);
    if (error.message) {
      throw error;
    }
    throw new Error("Không thể upload file. Vui lòng thử lại.");
  }
};

/**
 * Upload ảnh hóa đơn (helper function cho receipt)
 * @param {File} file - File ảnh hóa đơn
 * @returns {Promise<{message: string, url: string, filename: string, originalFilename: string, size: number, contentType: string}>}
 */
export const uploadReceipt = async (file) => {
  return uploadFile(file, 'receipt');
};

/**
 * Upload avatar (helper function cho avatar)
 * @param {File} file - File ảnh avatar
 * @returns {Promise<{message: string, url: string, filename: string, originalFilename: string, size: number, contentType: string}>}
 */
export const uploadAvatar = async (file) => {
  return uploadFile(file, 'avatar');
};

