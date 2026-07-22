import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";

// Get all roles
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await prisma.adminRole_.findMany({
    include: {
      _count: {
        select: { admins: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      { roles },
      "Roles fetched successfully"
    )
  );
});

// Get role by ID
export const getRoleById = asyncHandler(async (req, res) => {
  const { roleId } = req.params;

  const role = await prisma.adminRole_.findUnique({
    where: { id: roleId },
    include: {
      admins: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  res.status(200).json(
    new ApiResponsive(
      200,
      { role },
      "Role fetched successfully"
    )
  );
});

// Create a new role
export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;

  // Check if role name already exists
  const existingRole = await prisma.adminRole_.findUnique({
    where: { name },
  });

  if (existingRole) {
    throw new ApiError(409, "Role name already exists");
  }

  // Validate permissions format
  if (permissions && !Array.isArray(permissions)) {
    throw new ApiError(400, "Permissions must be an array");
  }

  const role = await prisma.adminRole_.create({
    data: {
      name,
      description,
      permissions: permissions || [],
      isSystem: false,
    },
  });

  res.status(201).json(
    new ApiResponsive(
      201,
      { role },
      "Role created successfully"
    )
  );
});

// Update a role
export const updateRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { name, description, permissions } = req.body;

  // Check if role exists
  const existingRole = await prisma.adminRole_.findUnique({
    where: { id: roleId },
  });

  if (!existingRole) {
    throw new ApiError(404, "Role not found");
  }

  // Prevent editing system roles
  if (existingRole.isSystem) {
    throw new ApiError(400, "Cannot edit system roles");
  }

  // Check if new name conflicts with existing role
  if (name && name !== existingRole.name) {
    const nameConflict = await prisma.adminRole_.findUnique({
      where: { name },
    });
    if (nameConflict) {
      throw new ApiError(409, "Role name already exists");
    }
  }

  // Validate permissions format
  if (permissions && !Array.isArray(permissions)) {
    throw new ApiError(400, "Permissions must be an array");
  }

  const role = await prisma.adminRole_.update({
    where: { id: roleId },
    data: {
      name: name || existingRole.name,
      description: description !== undefined ? description : existingRole.description,
      permissions: permissions || existingRole.permissions,
    },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      { role },
      "Role updated successfully"
    )
  );
});

// Delete a role
export const deleteRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;

  // Check if role exists
  const existingRole = await prisma.adminRole_.findUnique({
    where: { id: roleId },
    include: { admins: true },
  });

  if (!existingRole) {
    throw new ApiError(404, "Role not found");
  }

  // Prevent deleting system roles
  if (existingRole.isSystem) {
    throw new ApiError(400, "Cannot delete system roles");
  }

  // Check if role has admins assigned
  if (existingRole.admins.length > 0) {
    throw new ApiError(400, "Cannot delete role with assigned admins. Reassign admins first.");
  }

  await prisma.adminRole_.delete({
    where: { id: roleId },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      null,
      "Role deleted successfully"
    )
  );
});

// Update role permissions
export const updateRolePermissions = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body;

  // Check if role exists
  const existingRole = await prisma.adminRole_.findUnique({
    where: { id: roleId },
  });

  if (!existingRole) {
    throw new ApiError(404, "Role not found");
  }

  // Validate permissions format
  if (!Array.isArray(permissions)) {
    throw new ApiError(400, "Permissions must be an array");
  }

  const role = await prisma.adminRole_.update({
    where: { id: roleId },
    data: {
      permissions,
    },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      { role },
      "Role permissions updated successfully"
    )
  );
});

// Assign role to admin
export const assignRoleToAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { roleId } = req.body;

  // Check if admin exists
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  // Prevent changing SUPER_ADMIN's role
  if (admin.role === "SUPER_ADMIN") {
    throw new ApiError(400, "Cannot change Super Admin's role");
  }

  // Check if role exists (if roleId is provided)
  if (roleId) {
    const role = await prisma.adminRole_.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ApiError(404, "Role not found");
    }
  }

  // Update admin's role
  const updatedAdmin = await prisma.admin.update({
    where: { id: adminId },
    data: {
      roleId: roleId || null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      roleId: true,
    },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      { admin: updatedAdmin },
      "Role assigned successfully"
    )
  );
});

// Get all available permissions (for UI)
export const getAvailablePermissions = asyncHandler(async (req, res) => {
  const permissions = {
    resources: [
      { id: "dashboard", name: "Dashboard", actions: ["read"] },
      { id: "admins", name: "Admin Management", actions: ["create", "read", "update", "delete"] },
      { id: "users", name: "Users", actions: ["create", "read", "update", "delete"] },
      { id: "products", name: "Products", actions: ["create", "read", "update", "delete"] },
      { id: "orders", name: "Orders", actions: ["create", "read", "update", "delete"] },
      { id: "categories", name: "Categories", actions: ["create", "read", "update", "delete"] },
      { id: "reviews", name: "Reviews", actions: ["create", "read", "update", "delete"] },
      { id: "settings", name: "Settings", actions: ["read", "update"] },
      { id: "inventory", name: "Inventory", actions: ["create", "read", "update", "delete"] },
      { id: "flavors", name: "Flavors", actions: ["create", "read", "update", "delete"] },
      { id: "weights", name: "Weights", actions: ["create", "read", "update", "delete"] },
      { id: "coupons", name: "Coupons", actions: ["create", "read", "update", "delete"] },
      { id: "content", name: "Content", actions: ["create", "read", "update", "delete"] },
      { id: "contact", name: "Contact", actions: ["create", "read", "update", "delete"] },
      { id: "faqs", name: "FAQs", actions: ["create", "read", "update", "delete"] },
      { id: "analytics", name: "Analytics", actions: ["read"] },
      { id: "brands", name: "Brands", actions: ["create", "read", "update", "delete"] },
      { id: "banners", name: "Banners", actions: ["create", "read", "update", "delete"] },
    ],
  };

  res.status(200).json(
    new ApiResponsive(
      200,
      permissions,
      "Available permissions fetched successfully"
    )
  );
});
