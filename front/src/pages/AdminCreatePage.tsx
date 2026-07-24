import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminUsers } from "@/api/adminService";
import { Resource, Action, AdminRole_ } from "@/types/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  UserPlus,
  Key,
  ShieldCheck,
} from "lucide-react";

export default function AdminCreatePage() {
  const { admin: currentAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState<AdminRole_[]>([]);
  
  // Single Role Selection state (e.g. "SUPER_ADMIN", "ADMIN", or "custom_<roleId>")
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>("ADMIN");
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  // Check if current user is super admin
  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCustomRoles();
    }
  }, [isSuperAdmin]);

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
      if (data.success && Array.isArray(data.data?.roles)) {
        setCustomRoles(data.data.roles);
      }
    } catch (error) {
      console.error("Error fetching custom roles:", error);
    }
  };

  // State for custom fine-grained permissions
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    [Resource.DASHBOARD]: [Action.READ],
    [Resource.PRODUCTS]: [],
    [Resource.ORDERS]: [],
    [Resource.CATEGORIES]: [],
    [Resource.INVENTORY]: [],
    [Resource.FLAVORS]: [],
    [Resource.WEIGHTS]: [],
    [Resource.COUPONS]: [],
    [Resource.USERS]: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle permission toggles
  const togglePermission = (resource: Resource, action: Action) => {
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

  const hasPermission = (resource: Resource, action: Action): boolean => {
    return permissions[resource]?.includes(action) || false;
  };

  const toggleAllForResource = (resource: Resource) => {
    const allActions = [
      Action.CREATE,
      Action.READ,
      Action.UPDATE,
      Action.DELETE,
    ];
    const currentResourcePermissions = permissions[resource] || [];
    const hasAllPermissions = allActions.every((action) =>
      currentResourcePermissions.includes(action)
    );

    setPermissions((prev) => ({
      ...prev,
      [resource]: hasAllPermissions ? [] : [...allActions],
    }));
  };

  const formatPermissionsForApi = () => {
    const result: { resource: string; action: string }[] = [];

    Object.entries(permissions).forEach(([resource, actions]) => {
      actions.forEach((action) => {
        result.push({ resource, action });
      });
    });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.email.trim() ||
      !formData.password ||
      !formData.firstName.trim() ||
      !formData.lastName.trim()
    ) {
      toast.error("All required fields must be filled out");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      // Determine role and roleId from unified selection
      let role = "ADMIN";
      let roleId: string | undefined = undefined;

      if (selectedRoleOption === "SUPER_ADMIN") {
        role = "SUPER_ADMIN";
      } else if (selectedRoleOption.startsWith("custom_")) {
        role = "ADMIN";
        roleId = selectedRoleOption.replace("custom_", "");
      } else {
        role = "ADMIN";
      }

      const requestData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role,
        roleId,
        ...(useCustomPermissions && {
          customPermissions: formatPermissionsForApi(),
        }),
      };

      const response = await adminUsers.registerAdmin(requestData);

      if (response.data.success) {
        toast.success("New Admin created successfully!");
        navigate("/admins");
      } else {
        toast.error(response.data.message || "Failed to create admin");
      }
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(
        error.response?.data?.message || "An error occurred while creating admin"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto my-12">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-amber-900">Access Restricted</h2>
            <p className="text-amber-700 text-sm mt-1">
              Only Super Administrators can create new admin accounts.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admins")}
            className="h-9 w-9 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-[#2E7D32]" />
              Create New Admin User
            </h1>
            <p className="text-sm text-slate-500">
              Set up credentials and assign a role for a new administrator
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Info & Credentials */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
              <User className="h-4 w-4 text-[#2E7D32]" />
              1. Admin Credentials & Account Info
            </CardTitle>
            <CardDescription>
              Login credentials for admin.indianpharmazee.com/login
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700 font-medium">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="e.g. Rahul"
                    className="pl-9"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700 font-medium">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="e.g. Sharma"
                    className="pl-9"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email Address (Login Username) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. rahul@indianpharmazee.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Password Field with Eye Toggle */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className="pl-9 pr-10"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field with Eye Toggle */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    className="pl-9 pr-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Role */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
              <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
              2. Select Role for this Admin
            </CardTitle>
            <CardDescription>
              Choose a custom role created on /roles page or pick Super Admin / Standard Admin
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleOption" className="text-slate-800 font-semibold">
                Select Admin Role <span className="text-red-500">*</span>
              </Label>
              <select
                id="roleOption"
                value={selectedRoleOption}
                onChange={(e) => setSelectedRoleOption(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              >
                <option value="ADMIN">Standard Admin (Default permissions)</option>
                <option value="SUPER_ADMIN">👑 Super Admin (Full Access to Everything)</option>
                
                {customRoles.length > 0 && (
                  <optgroup label="✨ Custom Roles (Created on /roles)">
                    {customRoles.map((r) => (
                      <option key={r.id} value={`custom_${r.id}`}>
                        {r.name} {r.description ? `— ${r.description}` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-xs text-slate-500">
                Selecting a custom role will automatically assign all permissions defined in that role to this user.
              </p>
            </div>

            {/* Fine-Grain Custom Permissions Toggle */}
            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox
                  id="customPermissions"
                  checked={useCustomPermissions}
                  onCheckedChange={(checked) =>
                    setUseCustomPermissions(!!checked)
                  }
                />
                <Label htmlFor="customPermissions" className="font-semibold text-slate-800 cursor-pointer">
                  Customize granular page permissions manually for this user
                </Label>
              </div>

              {useCustomPermissions && (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-slate-500">
                    Check the exact actions (Create, Read, Update, Delete) this admin is allowed to perform for each page.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(Resource).map((resource) => {
                      const pageLabels: Record<string, string> = {
                        dashboard: "📊 Dashboard Page (/)",
                        admins: "🛡️ Admins & Roles (/admins, /roles)",
                        users: "👥 Customer Users (/users)",
                        products: "📦 Products, Sections & Flash Sales (/products, /product-sections, /flash-sales, /attributes, /pricing-slabs)",
                        orders: "🛒 Orders Management (/orders)",
                        categories: "🏷️ Categories & Subcategories (/categories)",
                        brands: "🏢 Brands Management (/brands)",
                        banners: "🖼️ Banners Management (/banners)",
                        coupons: "🎟️ Coupons & Discounts (/coupons)",
                        faqs: "❓ FAQ Management (/faq-management)",
                        reviews: "⭐ Product Reviews (/reviews)",
                        settings: "⚙️ Store & MOQ Settings (/moq-settings)",
                        inventory: "📦 Inventory Management (/inventory)",
                        analytics: "📈 Analytics & Reports (/analytics)",
                      };

                      const actionLabels: Record<string, string> = {
                        read: "👁️ View Page",
                        create: "➕ Add / Create",
                        update: "✏️ Edit / Toggle",
                        delete: "🗑️ Delete",
                      };

                      return (
                        <div
                          key={resource}
                          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-3">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">
                              {pageLabels[resource] || resource.replace("_", " ")}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <Checkbox
                                id={`resource-${resource}-all`}
                                checked={[
                                  Action.CREATE,
                                  Action.READ,
                                  Action.UPDATE,
                                  Action.DELETE,
                                ].every((action) =>
                                  hasPermission(resource as Resource, action)
                                )}
                                onCheckedChange={() =>
                                  toggleAllForResource(resource as Resource)
                                }
                              />
                              <Label
                                htmlFor={`resource-${resource}-all`}
                                className="text-xs font-semibold text-slate-600 cursor-pointer"
                              >
                                Select All
                              </Label>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {Object.values(Action).map((action) => (
                              <div
                                key={`${resource}-${action}`}
                                className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded border border-slate-200"
                              >
                                <Checkbox
                                  id={`${resource}-${action}`}
                                  checked={hasPermission(
                                    resource as Resource,
                                    action as Action
                                  )}
                                  onCheckedChange={() =>
                                    togglePermission(
                                      resource as Resource,
                                      action as Action
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`${resource}-${action}`}
                                  className="text-xs font-medium text-slate-700 cursor-pointer"
                                >
                                  {actionLabels[action] || action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between bg-slate-50/80 border-t border-slate-200 p-6 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admins")}
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white px-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating Admin...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Create Admin Account</span>
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
