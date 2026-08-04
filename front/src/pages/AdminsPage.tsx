import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminUsers } from "@/api/adminService";
import { Admin, AdminRole_ } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Shield, Loader2, Plus, Key } from "lucide-react";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [customRoles, setCustomRoles] = useState<AdminRole_[]>([]);
  const [loading, setLoading] = useState(true);
  const { admin: currentAdmin } = useAuth();
  const navigate = useNavigate();

  // Reset Password Dialog States
  const [resetAdminId, setResetAdminId] = useState<string | null>(null);
  const [resetAdminEmail, setResetAdminEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchAdmins();
    if (isSuperAdmin) {
      fetchCustomRoles();
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminUsers.getAllAdmins();
      if (response.data.success) {
        setAdmins(response.data.data.admins);
      } else {
        toast.error("Failed to fetch admins");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Error fetching admin users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/roles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCustomRoles(data.data.roles);
      }
    } catch (error) {
      console.error("Error fetching custom roles:", error);
    }
  };

  const handleResetPassword = async () => {
    if (!resetAdminId || !newPassword) {
      toast.error("Please enter a valid password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsResetting(true);
      const response = await adminUsers.resetAdminPassword(
        resetAdminId,
        newPassword
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Password reset successfully!"
        );
        setResetAdminId(null);
        setNewPassword("");
      } else {
        toast.error(response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(
        error.response?.data?.message || "Error resetting admin password"
      );
    } finally {
      setIsResetting(false);
    }
  };

  const updateAdminStatus = async (adminId: string, isActive: boolean) => {
    try {
      const response = await adminUsers.updateAdminRole(adminId, {
        role: admins.find((a) => a.id === adminId)?.role || "ADMIN",
        isActive,
      });

      if (response.data.success) {
        toast.success(
          `Admin ${isActive ? "activated" : "deactivated"} successfully`
        );
        fetchAdmins();
      } else {
        toast.error("Failed to update admin status");
      }
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Error updating admin status");
    }
  };

  const updateAdminRole = async (
    adminId: string,
    role: string,
    roleId: string | null = null
  ) => {
    try {
      const response = await adminUsers.updateAdminRole(adminId, {
        role,
        roleId,
      });

      if (response.data.success) {
        toast.success("Admin role updated successfully");
        fetchAdmins();
      } else {
        toast.error("Failed to update admin role");
      }
    } catch (error) {
      console.error("Error updating admin role:", error);
      toast.error("Error updating admin role");
    }
  };

  const assignCustomRole = async (adminId: string, roleId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/admins/${adminId}/assign-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ roleId: roleId || null }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Custom role assigned successfully");
        fetchAdmins();
      } else {
        toast.error(data.message || "Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Error assigning role");
    }
  };

  const handleUnifiedRoleChange = async (adminId: string, value: string) => {
    if (value === "SUPER_ADMIN") {
      await updateAdminRole(adminId, "SUPER_ADMIN", null);
    } else if (value.startsWith("custom_")) {
      const roleId = value.replace("custom_", "");
      await assignCustomRole(adminId, roleId);
    } else {
      await updateAdminRole(adminId, "ADMIN", null);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const response = await adminUsers.deleteAdmin(adminId);

      if (response.data.success) {
        toast.success("Admin deleted successfully");
        fetchAdmins();
      } else {
        toast.error("Failed to delete admin");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Error deleting admin");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500 hover:bg-red-600";
      case "ADMIN":
        return "bg-blue-500 hover:bg-blue-600";
      case "MANAGER":
        return "bg-primary hover:bg-primary/90";
      case "CONTENT_EDITOR":
        return "bg-[#2E7D32] hover:bg-[#1b5e20]";
      case "SUPPORT_AGENT":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/admins/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/roles")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Manage Roles
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : admins.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>No admin users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => (
            <Card
              key={admin.id}
              className={admin.isActive === false ? "opacity-70" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {admin.firstName} {admin.lastName}
                  </CardTitle>
                  <Badge
                    className={
                      admin.role === "SUPER_ADMIN"
                        ? getRoleBadgeColor("SUPER_ADMIN")
                        : admin.assignedRole
                        ? "bg-purple-600 hover:bg-purple-700"
                        : getRoleBadgeColor("ADMIN")
                    }
                  >
                    {admin.role === "SUPER_ADMIN"
                      ? "SUPER_ADMIN"
                      : admin.assignedRole
                      ? admin.assignedRole.name
                      : "ADMIN"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
              </CardHeader>

              <CardContent>
                <div className="text-sm">
                  <p className="mb-1">
                    <span className="font-medium">Status: </span>
                    <Badge
                      variant={admin.isActive !== false ? "default" : "outline"}
                    >
                      {admin.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </p>

                  <p className="mb-1">
                    <span className="font-medium">Last Login: </span>
                    {admin.lastLogin
                      ? new Date(admin.lastLogin).toLocaleString()
                      : "Never"}
                  </p>

                  {admin.assignedRole && (
                    <p className="mb-1">
                      <span className="font-medium">Assigned Role: </span>
                      <Badge variant="secondary">
                        {admin.assignedRole.name}
                      </Badge>
                    </p>
                  )}

                  <Separator className="my-2" />

                  {isSuperAdmin && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {admin.id !== currentAdmin?.id && (
                        <>
                          {admin.isActive !== false ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAdminStatus(admin.id, false)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAdminStatus(admin.id, true)}
                            >
                              Activate
                            </Button>
                          )}

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAdmin(admin.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/admins/permissions/${admin.id}`)
                        }
                      >
                        Permissions
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-400 text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          setResetAdminId(admin.id);
                          setResetAdminEmail(admin.email);
                          setNewPassword("");
                        }}
                      >
                        <Key className="mr-1 h-3.5 w-3.5" />
                        Reset Password
                      </Button>

                      {admin.id !== currentAdmin?.id && (
                        <div className="flex flex-col gap-1 w-full mt-2">
                          <label className="text-xs font-semibold text-slate-600">
                            Role & Access Level:
                          </label>
                          <select
                            className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white font-medium shadow-sm focus:ring-2 focus:ring-[#2E7D32]"
                            value={
                              admin.roleId
                                ? `custom_${admin.roleId}`
                                : admin.role === "SUPER_ADMIN"
                                ? "SUPER_ADMIN"
                                : "ADMIN"
                            }
                            onChange={(e) =>
                              handleUnifiedRoleChange(admin.id, e.target.value)
                            }
                          >
                            <option value="ADMIN">
                              Standard Admin (Default permissions)
                            </option>
                            <option value="SUPER_ADMIN">
                              👑 Super Admin (Full Access to Everything)
                            </option>

                            {customRoles.length > 0 && (
                              <optgroup label="✨ Custom Roles">
                                {customRoles.map((role) => (
                                  <option key={role.id} value={`custom_${role.id}`}>
                                    {role.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetAdminId}
        onOpenChange={(open) => {
          if (!open) {
            setResetAdminId(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetAdminEmail}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                New Password
              </label>
              <Input
                type="text"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetAdminId(null);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={isResetting}
              onClick={handleResetPassword}
              className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Save New Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isSuperAdmin && (
        <div className="rounded-lg border bg-amber-50 p-4 mt-4">
          <p className="text-amber-800">
            Only Super Admins can manage other admin users. Contact your
            administrator for assistance.
          </p>
        </div>
      )}
    </div>
  );
}
