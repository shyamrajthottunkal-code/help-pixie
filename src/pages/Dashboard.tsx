import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpBot } from "@/components/HelpBot";

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchComplaints(session.user.id);
        } else {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchComplaints(session.user.id);
    } else {
      navigate("/auth");
    }
    setLoading(false);
  };

  const fetchComplaints = async (userId: string) => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch complaints",
      });
      return;
    }

    setComplaints(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary-light/20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">My Dashboard</h1>
          <Button onClick={handleLogout} variant="ghost">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Total Complaints
            </h3>
            <p className="text-3xl font-bold text-primary">{complaints.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Pending
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {complaints.filter((c) => c.status === "pending").length}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              In Progress
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {complaints.filter((c) => c.status === "in_progress").length}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Resolved
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {complaints.filter((c) => c.status === "resolved").length}
            </p>
          </Card>
        </div>

        {/* New Complaint Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate("/new-complaint")}
            size="lg"
            className="shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Submit New Complaint
          </Button>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Complaints</h2>
          {complaints.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No complaints yet. Submit your first one!
              </p>
            </Card>
          ) : (
            complaints.map((complaint) => (
              <Card
                key={complaint.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {complaint.title}
                    </h3>
                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                      <Badge variant="secondary">{complaint.category}</Badge>
                      <span>•</span>
                      <span>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(complaint.status)}>
                    {complaint.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      <HelpBot />
    </div>
  );
};

export default Dashboard;
