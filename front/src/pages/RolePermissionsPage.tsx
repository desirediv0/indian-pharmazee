import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Shield } from "lucide-react";

interface Permission {
  resource: string;
  action: string;
}

interface Resource {
  id: string;
  name: string;
  actions: string[];
}

export default function RolePermissionsPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { admin: currentAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!roleId) return;
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      // Fetch available permissions
      const permResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/roles/permissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const permData = await permResponse.json();
      if (permData.success) {
        setResources(permData.data.resources);
      }

      // Fetch role data
      const roleResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/roles/${roleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const roleData = await roleResponse.json();
      if (roleData.success) {
        const role = roleData.data.role;
        setRoleName(role.name);

        // Initialize permissions from role data
        const rolePermissions: Record<string, string[]> = {};
        permData.data.resources.forEach((r: Resource) => {
          rolePermissions[r.id] = [];
        });

        // Parse existing permissions
        let existingPermissions: Permission[] = [];
        if (role.permissions && Array.isArray(role.permissions)) {
          existingPermissions = role.permissions;
        } else if (typeof role.permissions === "string") {
          try {
            existingPermissions = JSON.parse(role.permissions);
          } catch (e) {
            console.error("Error parsing permissions:", e);
          }
        }

        existingPermissions.forEach((perm: Permission) => {
          if (rolePermissions[perm.resource]) {
            rolePermissions[perm.resource].push(perm.action);
          }
        });

        setPermissions(rolePermissions);
      } else {
        toast.error("Failed to fetch role data");
        navigate("/roles");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data");
      navigate("/roles");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    setPermissions((prev) => {
      const current = prev[resource] || [];
      const exists = current.includes(action);

      const updated = exists
        ? current.filter((a) => a !== action)
        : [...current, action];

      return {
        ...prev,
        [resource]: updated,
      };
    });
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions[resource]?.includes(action) || false;
  };

  const toggleAllForResource = (resource: string) => {
    const resourceData = resources.find((r) => r.id === resource);
    if (!resourceData) return;

    const allActions = resourceData.actions;
    const currentResourcePermissions = permissions[resource] || [];
    const hasAllPermissions = allActions.every((action) =>
      currentResourcePermissions.includes(action)
    );

    setPermissions((prev) => ({
      ...prev,
      [resource]: hasAllPermissions ? [] : [...allActions],
    }));
  };

  const toggleAllActions = () => {
    const allPermissions: Record<string, string[]> = {};
    const allHaveAllPermissions = resources.every((resource) => {
      const currentResourcePermissions = permissions[resource.id] || [];
      return resource.actions.every((action) =>
        currentResourcePermissions.includes(action)
      );
    });

    resources.forEach((resource) => {
      allPermissions[resource.id] = allHaveAllPermissions
        ? []
        : [...resource.actions];
    });

    setPermissions(allPermissions);
  };

  const formatPermissionsForApi = (): Permission[] => {
    const result: Permission[] = [];

    Object.entries(permissions).forEach(([resource, actions]) => {
      actions.forEach((action) => {
        result.push({ resource, action });
      });
    });

    return result;
  };

  const handleSavePermissions = async () => {
    if (!roleId) return;

    try {
      setSaving(true);
      const formattedPermissions = formatPermissionsForApi();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/roles/${roleId}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ permissions: formattedPermissions }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Role permissions updated successfully");
        navigate("/roles");
      } else {
        toast.error(data.message || "Failed to update permissions");
      }
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast.error("Error updating permissions");
    } finally {
      setSaving(false);
    }
  };

  const getTotalPermissions = (): number => {
    let count = 0;
    Object.values(permissions).forEach((actions) => {
      count += actions.length;
    });
    return count;
  };

  const getTotalPossiblePermissions = (): number => {
    let count = 0;
    resources.forEach((resource) => {
      count += resource.actions.length;
    });
    return count;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading role permissions...
          </p>
        </div>
      </div>
    );
  }

  // Only proceed if user is a super admin
  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <p className="text-amber-800">
                Only Super Admins can manage role permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/roles")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Role Permissions</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {roleName}
              <span className="text-sm">
                ({getTotalPermissions()}/{getTotalPossiblePermissions()} permissions)
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleAllActions}>
            {resources.every((r) =>
              r.actions.every((a) =>
                permissions[r.id]?.includes(a)
              )
            )
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button onClick={handleSavePermissions} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Permissions
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`resource-${resource.id}-all`}
                    checked={resource.actions.every((action) =>
                      hasPermission(resource.id, action)
                    )}
                    onCheckedChange={() => toggleAllForResource(resource.id)}
                  />
                  <Label
                    htmlFor={`resource-${resource.id}-all`}
                    className="font-bold text-lg"
                  >
                    {resource.name}
                  </Label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {permissions[resource.id]?.length || 0}/{resource.actions.length} permissions
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {resource.actions.map((action) => (
                  <div
                    key={`${resource.id}-${action}`}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${resource.id}-${action}`}
                      checked={hasPermission(resource.id, action)}
                      onCheckedChange={() =>
                        togglePermission(resource.id, action)
                      }
                    />
                    <Label
                      htmlFor={`${resource.id}-${action}`}
                      className="capitalize"
                    >
                      {action}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
