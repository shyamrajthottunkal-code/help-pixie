import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Phone, FileText, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmojiPicker from "emoji-picker-react";

interface Message {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  is_bot: boolean;
}

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchComplaint();
    fetchMessages();
    getCurrentUser();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `complaint_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchComplaint = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch complaint details",
      });
      return;
    }

    setComplaint(data);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch messages",
      });
      return;
    }

    setMessages(data || []);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        complaint_id: id,
        sender_id: currentUserId,
        text: input,
        is_bot: false,
      });

      if (error) throw error;

      setInput("");
      setShowEmojiPicker(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/1234567890?text=Regarding complaint: ${complaint?.title}`, "_blank");
  };

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-secondary">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">
                {complaint.title}
              </h1>
              <div className="flex gap-2 items-center">
                <Badge variant="secondary">{complaint.category}</Badge>
                <Badge>{complaint.status}</Badge>
              </div>
            </div>
            <Button onClick={handleWhatsApp} variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp Support
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaint Details */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Complaint Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{complaint.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm mt-1">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                    <div className="space-y-2">
                      {complaint.attachments.map((file: any, index: number) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-md bg-muted hover:bg-accent transition-colors"
                        >
                          {file.type?.startsWith('image/') && (
                            <ImageIcon className="h-4 w-4 text-primary" />
                          )}
                          {file.type?.startsWith('video/') && (
                            <Video className="h-4 w-4 text-primary" />
                          )}
                          {file.type?.startsWith('application/') && (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                          <span className="text-xs truncate flex-1">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <div className="p-4 border-b bg-muted">
                <h3 className="font-semibold">Chat with Support</h3>
              </div>

              <ScrollArea className="flex-1 p-4 bg-muted">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${
                      msg.sender_id === currentUserId
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender_id === currentUserId
                          ? "bg-primary text-primary-foreground"
                          : "bg-chat-green text-chat-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollArea>

              {showEmojiPicker && (
                <div className="p-2">
                  <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" />
                </div>
              )}

              <div className="p-4 border-t flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="px-2"
                >
                  😊
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComplaintDetail;
