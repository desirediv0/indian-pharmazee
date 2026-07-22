import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getAllAdmins,
  updateAdminRole,
  deleteAdmin,
  updateAdminPermissions,
  getLowStockAlerts,
  getUsers,
  getUserById,
  verifyUserEmail,
  deleteUser,
  updateUserDetails,
  getPaymentSettings,
  updatePaymentSettings,
  getPriceVisibilitySettings,
  updatePriceVisibilitySettings,
} from "../controllers/admin.controller.js";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  assignRoleToAdmin,
  getAvailablePermissions,
} from "../controllers/role.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
  hasRole,
} from "../middlewares/admin.middleware.js";
import {
  getMostViewedPages,
  getMostViewedProducts,
  getUsersWithProductsInCart,
  getAnalyticsDashboard,
} from "../controllers/analytics.controller.js";

const router = express.Router();

// Admin Auth Routes
router.post("/login", loginAdmin);

// Register admin - require authentication and Super Admin role
router.post("/register", verifyAdminJWT, hasRole("SUPER_ADMIN"), registerAdmin);

// Admin Profile Routes
router.get("/profile", verifyAdminJWT, getAdminProfile);
router.patch("/profile", verifyAdminJWT, updateAdminProfile);
router.post("/change-password", verifyAdminJWT, changeAdminPassword);

// Dashboard Routes
router.get(
  "/inventory-alerts",
  verifyAdminJWT,
  hasPermission("inventory", "read"),
  getLowStockAlerts
);

// Admin Management Routes (Super Admin Only)
router.get("/admins", verifyAdminJWT, hasRole("SUPER_ADMIN"), getAllAdmins);

router.patch(
  "/admins/:adminId",
  verifyAdminJWT,
  hasRole("SUPER_ADMIN"),
  updateAdminRole
);

router.delete(
  "/admins/:adminId",
  verifyAdminJWT,
  hasRole("SUPER_ADMIN"),
  deleteAdmin
);

// Update admin permissions (can be used to fix missing permissions)
router.post(
  "/admins/:adminId/update-permissions",
  verifyAdminJWT,
  hasRole("SUPER_ADMIN"),
  updateAdminPermissions
);

// Role Management Routes (Super Admin Only)
router.get("/roles", verifyAdminJWT, hasRole("SUPER_ADMIN"), getAllRoles);
router.get("/roles/permissions", verifyAdminJWT, hasRole("SUPER_ADMIN"), getAvailablePermissions);
router.get("/roles/:roleId", verifyAdminJWT, hasRole("SUPER_ADMIN"), getRoleById);
router.post("/roles", verifyAdminJWT, hasRole("SUPER_ADMIN"), createRole);
router.put("/roles/:roleId", verifyAdminJWT, hasRole("SUPER_ADMIN"), updateRole);
router.delete("/roles/:roleId", verifyAdminJWT, hasRole("SUPER_ADMIN"), deleteRole);
router.put("/roles/:roleId/permissions", verifyAdminJWT, hasRole("SUPER_ADMIN"), updateRolePermissions);
router.post("/admins/:adminId/assign-role", verifyAdminJWT, hasRole("SUPER_ADMIN"), assignRoleToAdmin);

// User Management Routes
router.get("/users", verifyAdminJWT, hasPermission("users", "read"), getUsers);

router.get(
  "/users/:userId",
  verifyAdminJWT,
  hasPermission("users", "read"),
  getUserById
);

router.post(
  "/users/:userId/verify-email",
  verifyAdminJWT,
  hasPermission("users", "update"),
  verifyUserEmail
);

router.patch(
  "/users/:userId",
  verifyAdminJWT,
  hasPermission("users", "update"),
  updateUserDetails
);

router.delete(
  "/users/:userId",
  verifyAdminJWT,
  hasPermission("users", "delete"),
  deleteUser
);

// Analytics routes
router.get(
  "/analytics/dashboard",
  verifyAdminJWT,
  hasPermission("analytics", "read"),
  getAnalyticsDashboard
);
router.get(
  "/analytics/pages",
  verifyAdminJWT,
  hasPermission("analytics", "read"),
  getMostViewedPages
);
router.get(
  "/analytics/products",
  verifyAdminJWT,
  hasPermission("analytics", "read"),
  getMostViewedProducts
);
router.get(
  "/analytics/carts",
  verifyAdminJWT,
  hasPermission("analytics", "read"),
  getUsersWithProductsInCart
);

// Payment Settings Routes
router.get(
  "/payment-settings",
  verifyAdminJWT,
  hasPermission("settings", "read"),
  getPaymentSettings
);

router.patch(
  "/payment-settings",
  verifyAdminJWT,
  hasPermission("settings", "update"),
  updatePaymentSettings
);

// Price Visibility Settings Routes
router.get(
  "/price-visibility-settings",
  verifyAdminJWT,
  hasPermission("settings", "read"),
  getPriceVisibilitySettings
);

router.patch(
  "/price-visibility-settings",
  verifyAdminJWT,
  hasPermission("settings", "update"),
  updatePriceVisibilitySettings
);

export default router;
