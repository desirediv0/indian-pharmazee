import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { adminUsers } from "@/api/adminService";
import { Admin, Role, AdminRole_ } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Shield, Loader2, Plus } from "lucide-react";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [customRoles, setCustomRoles] = useState<AdminRole_[]>([]);
  const [loading, setLoading] = useState(true);
  const { admin: currentAdmin } = useAuth();
  const navigate = useNavigate();

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

  const updateAdminRole = async (adminId: string, role: string) => {
    try {
      const response = await adminUsers.updateAdminRole(adminId, { role });

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
        return "bg-purple-500 hover:bg-purple-600";
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
                  <Badge className={getRoleBadgeColor(admin.role)}>
                    {admin.role}
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
                      <span className="font-medium">Custom Role: </span>
                      <Badge variant="secondary">
                        {admin.assignedRole.name}
                      </Badge>
                    </p>
                  )}

                  <Separator className="my-2" />

                  {isSuperAdmin && admin.id !== currentAdmin?.id && (
                    <div className="flex flex-wrap gap-2 mt-3">
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

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/admins/permissions/${admin.id}`)
                        }
                      >
                        Permissions
                      </Button>

                      <div className="flex flex-col gap-1">
                        <select
                          className="px-2 py-1 text-sm border rounded"
                          value={admin.role}
                          onChange={(e) =>
                            updateAdminRole(admin.id, e.target.value)
                          }
                        >
                          {Object.keys(Role).map((role) => (
                            <option key={role} value={role}>
                              {role.replace("_", " ")}
                            </option>
                          ))}
                        </select>

                        {customRoles.length > 0 && (
                          <select
                            className="px-2 py-1 text-sm border rounded"
                            value={admin.roleId || ""}
                            onChange={(e) =>
                              assignCustomRole(admin.id, e.target.value)
                            }
                          >
                            <option value="">No Custom Role</option>
                            {customRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
