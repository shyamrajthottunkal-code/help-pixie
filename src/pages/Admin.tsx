import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  LogOut,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { HelpBot } from "@/components/HelpBot";

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  profiles: {
    name: string;
    email: string;
  };
}

interface User {
  user_id: string;
  name: string;
  phone: string | null;
  email: string;
  roles: string[];
}

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have admin access",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await Promise.all([fetchComplaints(), fetchUsers()]);
    setLoading(false);
  };

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch complaints",
      });
      return;
    }

    // Get profile and email for each complaint
    const complaintsWithDetails = await Promise.all(
      (data || []).map(async (complaint) => {
        // Get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, user_id")
          .eq("user_id", complaint.created_by)
          .single();

        // Get email from auth
        const { data: authData } = await supabase.auth.admin.listUsers();
        const user = authData?.users?.find((u: any) => u.id === complaint.created_by);

        return {
          ...complaint,
          profiles: {
            name: profile?.name || "Unknown",
            email: user?.email || "N/A",
          },
        };
      })
    );

    setComplaints(complaintsWithDetails);

    // Calculate stats
    const total = data?.length || 0;
    const pending = data?.filter((c) => c.status === "pending").length || 0;
    const in_progress =
      data?.filter((c) => c.status === "in_progress").length || 0;
    const resolved = data?.filter((c) => c.status === "resolved").length || 0;
    const closed = data?.filter((c) => c.status === "closed").length || 0;

    setStats({ total, pending, in_progress, resolved, closed });
  };

  const fetchUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, phone");

    if (profilesError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
      return;
    }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Get all users from auth
    const { data: authData } = await supabase.auth.admin.listUsers();

    // Combine profile, role, and auth data
    const usersWithDetails = (profilesData || []).map((profile) => {
      const authUser = authData?.users?.find((u: any) => u.id === profile.user_id);
      const userRoles =
        rolesData?.filter((r) => r.user_id === profile.user_id).map((r) => r.role) || [];
      
      return {
        ...profile,
        email: authUser?.email || "N/A",
        roles: userRoles,
      };
    });

    setUsers(usersWithDetails);
    setStaff(usersWithDetails.filter((u) => u.roles.includes("staff") || u.roles.includes("admin")));
  };

  const handleAssignComplaint = async (complaintId: string, staffId: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({
        assigned_to: staffId === "unassign" ? null : staffId,
        status: staffId === "unassign" ? "pending" : "in_progress",
      })
      .eq("id", complaintId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign complaint",
      });
      return;
    }

    toast({
      title: "Success",
      description:
        staffId === "unassign"
          ? "Complaint unassigned"
          : "Complaint assigned successfully",
    });

    fetchComplaints();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    // First, remove existing role
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Then add new role
    const { error } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role: newRole as "admin" | "staff" | "student" }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role",
      });
      return;
    }

    toast({
      title: "Success",
      description: "User role updated successfully",
    });

    fetchUsers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      resolved: "bg-green-500",
      closed: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-secondary">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage complaints and users
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              My Dashboard
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.in_progress}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.resolved}
                </p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Closed</p>
                <p className="text-3xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-gray-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="complaints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="complaints">
              <FileText className="h-4 w-4 mr-2" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Complaints Management */}
          <TabsContent value="complaints" className="space-y-4">
            <h2 className="text-xl font-semibold">Complaint Management</h2>
            {complaints.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No complaints found</p>
              </Card>
            ) : (
              complaints.map((complaint) => (
                <Card key={complaint.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold text-lg">{complaint.title}</h3>
                        <Badge className={getStatusBadge(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{complaint.category}</Badge>
                        <span>•</span>
                        <span>By: {complaint.profiles.name}</span>
                        <span>•</span>
                        <span>{complaint.profiles.email}</span>
                        <span>•</span>
                        <span>
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <Select
                        value={complaint.assigned_to || "unassigned"}
                        onValueChange={(value) =>
                          handleAssignComplaint(complaint.id, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassign">Unassigned</SelectItem>
                          {staff.map((member) => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                              {member.name} ({member.roles.join(", ")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/complaint/${complaint.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            {users.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No users found</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => (
                  <Card key={user.user_id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{user.name}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Email: {user.email}</p>
                          {user.phone && <p>Phone: {user.phone}</p>}
                          <div className="flex gap-2 mt-2">
                            {user.roles.map((role) => (
                              <Badge key={role} variant="secondary">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-[180px]">
                        <Select
                          value={user.roles[0] || "student"}
                          onValueChange={(value) =>
                            handleUpdateRole(user.user_id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-xl font-semibold">Analytics Overview</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{
                            width: `${(stats.pending / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {stats.pending}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">In Progress</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(stats.in_progress / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {stats.in_progress}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resolved</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(stats.resolved / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {stats.resolved}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Closed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500"
                          style={{
                            width: `${(stats.closed / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {stats.closed}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">User Roles</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Students</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${
                              (users.filter((u) => u.roles.includes("student"))
                                .length /
                                users.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {users.filter((u) => u.roles.includes("student")).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Staff</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${
                              (users.filter((u) => u.roles.includes("staff"))
                                .length /
                                users.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {users.filter((u) => u.roles.includes("staff")).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admins</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${
                              (users.filter((u) => u.roles.includes("admin"))
                                .length /
                                users.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {users.filter((u) => u.roles.includes("admin")).length}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:col-span-2">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {users.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {staff.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Staff Members</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.total > 0
                        ? Math.round((stats.resolved / stats.total) * 100)
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Resolution Rate
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.pending + stats.in_progress}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Cases</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <HelpBot />
    </div>
  );
};

export default Admin;
