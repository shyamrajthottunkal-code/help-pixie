import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmojiPicker from "emoji-picker-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

export const HelpBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi 👋 I'm HelpBot! How can I assist you today?",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickReplies = [
    "Submit Complaint",
    "Track Status",
    "Contact Support",
  ];

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowEmojiPicker(false);

    // Get AI response
    setTimeout(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-bot`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ message: messageText }),
          }
        );

        const data = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply || "Sorry, I'm having trouble responding right now.",
          isBot: true,
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Bot error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm experiencing technical difficulties. Please try again! 😅",
          isBot: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }, 500);
  };

  const getBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("submit") || lowerInput.includes("complaint")) {
      return "You can submit a complaint by clicking the 'New Complaint' button on your dashboard. I'll guide you through the process! 📝";
    } else if (lowerInput.includes("track") || lowerInput.includes("status")) {
      return "To track your complaint status, go to your dashboard where you'll see all your complaints and their current status. 📊";
    } else if (lowerInput.includes("contact") || lowerInput.includes("support")) {
      return "You can contact support via WhatsApp or call directly from the complaint page. Our team is here to help! 📞";
    } else {
      return "I'm here to help! You can ask me about submitting complaints, tracking status, or contacting support. What would you like to know? 😊";
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-xl z-40 flex flex-col">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold">HelpBot</h3>
            </div>
            <p className="text-sm opacity-90">Always here to help!</p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-muted">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.isBot
                      ? "bg-chat-green text-chat-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </ScrollArea>

          {/* Quick Replies */}
          <div className="p-3 border-t flex gap-2 flex-wrap">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                onClick={() => handleSend(reply)}
                className="text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          {/* Input */}
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
            <Button onClick={() => handleSend()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
