// Định nghĩa quy tắc quyền hạn tại một nơi duy nhất
export const PERMISSIONS = {
  CAN_EDIT_TRANSACTION: ["OWNER", "ADMIN", "EDITOR"],
  CAN_MANAGE_MEMBERS: ["OWNER", "ADMIN"],
  CAN_CONVERT_WALLET: ["OWNER"],
};

export const hasPermission = (role, action) => {
  if (!role || !action) return false;
  return PERMISSIONS[action]?.includes(role);
};

// Logic phân cấp cho UI dropdown
export const getAvailableRolesToAssign = (currentUserRole) => {
  if (currentUserRole === "OWNER") return ["ADMIN", "EDITOR", "VIEWER"];
  if (currentUserRole === "ADMIN") return ["EDITOR", "VIEWER"];
  return [];
};
