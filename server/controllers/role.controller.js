import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getDefaultPermissionsForRole } from "./admin.controller.js";

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

// Helper to sync role permissions to all assigned admins
const syncAdminsPermissionsForRole = async (tx, roleId, permissions) => {
  const admins = await tx.admin.findMany({
    where: { roleId },
    select: { id: true },
  });

  for (const admin of admins) {
    await tx.permission.deleteMany({
      where: { adminId: admin.id },
    });

    if (Array.isArray(permissions)) {
      for (const perm of permissions) {
        if (perm.resource && perm.action) {
          await tx.permission.create({
            data: {
              adminId: admin.id,
              resource: perm.resource,
              action: perm.action,
            },
          });
        }
      }
    }
  }
};

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

  const role = await prisma.$transaction(async (tx) => {
    const updated = await tx.adminRole_.update({
      where: { id: roleId },
      data: {
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        permissions: permissions || existingRole.permissions,
      },
    });

    if (permissions && Array.isArray(permissions)) {
      await syncAdminsPermissionsForRole(tx, roleId, permissions);
    }

    return updated;
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

  // Prevent editing system roles
  if (existingRole.isSystem) {
    throw new ApiError(400, "Cannot edit permissions of system roles");
  }

  // Validate permissions format
  if (!Array.isArray(permissions)) {
    throw new ApiError(400, "Permissions must be an array");
  }

  const role = await prisma.$transaction(async (tx) => {
    const updated = await tx.adminRole_.update({
      where: { id: roleId },
      data: {
        permissions,
      },
    });

    await syncAdminsPermissionsForRole(tx, roleId, permissions);

    return updated;
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
  let roleData = null;
  if (roleId) {
    roleData = await prisma.adminRole_.findUnique({
      where: { id: roleId },
    });

    if (!roleData) {
      throw new ApiError(404, "Role not found");
    }
  }

  // Update admin's role AND permissions in a transaction
  const updatedAdmin = await prisma.$transaction(async (tx) => {
    // Update roleId on admin
    const admin = await tx.admin.update({
      where: { id: adminId },
      data: {
        roleId: roleId || null,
      },
    });

    // Delete existing permissions
    await tx.permission.deleteMany({
      where: { adminId },
    });

    // If a role is assigned, copy its permissions to the admin
    if (roleData) {
      if (Array.isArray(roleData.permissions)) {
        for (const perm of roleData.permissions) {
          if (perm.resource && perm.action) {
            await tx.permission.create({
              data: {
                adminId,
                resource: perm.resource,
                action: perm.action,
              },
            });
          }
        }
      }
    } else {
      // No custom role assigned - give default permissions for admin.role
      const defaultPerms = getDefaultPermissionsForRole(admin.role);
      for (const perm of defaultPerms) {
        await tx.permission.create({
          data: {
            adminId,
            resource: perm.resource,
            action: perm.action,
          },
        });
      }
    }

    return admin;
  });

  // Fetch updated admin with permissions
  const adminWithPermissions = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { permissions: true },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        admin: {
          id: adminWithPermissions.id,
          firstName: adminWithPermissions.firstName,
          lastName: adminWithPermissions.lastName,
          email: adminWithPermissions.email,
          role: adminWithPermissions.role,
          roleId: adminWithPermissions.roleId,
          permissions: adminWithPermissions.permissions,
        },
      },
      "Role assigned and permissions updated successfully"
    )
  );
});

// Get all available permissions (for UI)
export const getAvailablePermissions = asyncHandler(async (req, res) => {
  const permissions = {
    resources: [
      { id: "dashboard", name: "Dashboard Page (/)", actions: ["read"] },
      { id: "admins", name: "Admin Management (/admins & /roles)", actions: ["create", "read", "update", "delete"] },
      { id: "users", name: "User Management (/users)", actions: ["create", "read", "update", "delete"] },
      { id: "products", name: "Products, Sections, Flash Sales & Attributes (/products, /product-sections, /flash-sales, /attributes, /pricing-slabs)", actions: ["create", "read", "update", "delete"] },
      { id: "orders", name: "Orders Management (/orders)", actions: ["create", "read", "update", "delete"] },
      { id: "categories", name: "Categories & Sub-categories (/categories)", actions: ["create", "read", "update", "delete"] },
      { id: "brands", name: "Brands Management (/brands)", actions: ["create", "read", "update", "delete"] },
      { id: "banners", name: "Banners Management (/banners)", actions: ["create", "read", "update", "delete"] },
      { id: "coupons", name: "Coupons & Discounts (/coupons)", actions: ["create", "read", "update", "delete"] },
      { id: "faqs", name: "FAQ Management (/faq-management)", actions: ["create", "read", "update", "delete"] },
      { id: "reviews", name: "Product Reviews (/reviews)", actions: ["create", "read", "update", "delete"] },
      { id: "settings", name: "Store & MOQ Settings (/moq-settings)", actions: ["read", "update"] },
      { id: "inventory", name: "Inventory Management (/inventory)", actions: ["create", "read", "update", "delete"] },
      { id: "analytics", name: "Analytics & Reports (/analytics)", actions: ["read"] },
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
