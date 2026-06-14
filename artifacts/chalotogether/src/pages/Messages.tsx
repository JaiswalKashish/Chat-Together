import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetConversations, useGetMessages, useSendMessage, useMarkMessagesRead } from "@workspace/api-client-react";
import type { Conversation, Message } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, CheckCheck, CheckCircle2, Loader2, Search, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

export function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: conversations = [], refetch: refetchConvos } = useGetConversations({
    query: { queryKey: ["conversations"] },
  });

  const { data: serverMessages = [], refetch: refetchMessages } = useGetMessages(
    { userId: selectedConvo?.userId ?? 0 },
    { query: { enabled: !!selectedConvo, queryKey: ["messages", selectedConvo?.userId] } }
  );

  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  // Sync server messages into local state when conversation changes
  useEffect(() => {
    setLocalMessages(serverMessages as Message[]);
  }, [serverMessages]);

  // Socket.io for real-time
  useEffect(() => {
    if (!user) return;
    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join", user.id));
    socket.on("newMessage", (msg: Message) => {
      setLocalMessages((prev) => [...prev, msg]);
      refetchConvos();
    });
    return () => { socket.disconnect(); };
  }, [user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (selectedConvo) {
      markRead.mutate({ data: { senderId: selectedConvo.userId } });
    }
  }, [selectedConvo?.userId]);

  async function handleSend() {
    if (!selectedConvo || !messageText.trim()) return;
    const content = messageText.trim();
    setMessageText("");

    const optimisticMsg: Message = {
      id: Date.now(),
      senderId: user!.id,
      senderName: user!.fullName,
      receiverId: selectedConvo.userId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage.mutateAsync({ data: { receiverId: selectedConvo.userId, content } });
      refetchConvos();
    } catch {
      setLocalMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }
  }

  const filteredConvos = conversations.filter((c) =>
    c.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">Chat with your community members and ride partners.</p>
        </div>

        <div className="flex h-[calc(100%-5rem)] gap-4">
          {/* Conversations List */}
          <div className={`${selectedConvo ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 bg-card border border-border/50 rounded-xl overflow-hidden`}>
            <div className="p-4 border-b border-border/30">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations…"
                  className="pl-9 bg-background border-border/50 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <MessageCircle size={32} className="text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start chatting with community members from their profile.</p>
                </div>
              ) : (
                filteredConvos.map((convo) => (
                  <button
                    key={convo.userId}
                    onClick={() => setSelectedConvo(convo)}
                    className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors border-b border-border/20 ${
                      selectedConvo?.userId === convo.userId ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center text-sm font-bold shrink-0">
                        {convo.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-medium text-sm truncate">{convo.userName}</span>
                            {convo.isVerified && <CheckCircle2 size={12} className="text-blue-400 shrink-0" />}
                          </div>
                          {convo.unreadCount > 0 && (
                            <Badge className="bg-primary text-white text-xs h-5 px-1.5 shrink-0">{convo.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${selectedConvo ? "flex" : "hidden sm:flex"} flex-col flex-1 bg-card border border-border/50 rounded-xl overflow-hidden`}>
            {!selectedConvo ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle size={48} className="text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose a chat from the left to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border/30">
                  <button
                    className="sm:hidden text-muted-foreground hover:text-foreground mr-1"
                    onClick={() => setSelectedConvo(null)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center text-sm font-bold">
                    {selectedConvo.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm">{selectedConvo.userName}</span>
                      {selectedConvo.isVerified && <CheckCircle2 size={13} className="text-blue-400" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedConvo.userCollege}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {localMessages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                              <span className={`text-xs ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isMe && (
                                msg.isRead
                                  ? <CheckCheck size={12} className="text-blue-300" />
                                  : <CheckCheck size={12} className="text-white/50" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/30">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message…"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      className="bg-background border-border/50"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sendMessage.isPending}
                      size="icon"
                      className="bg-primary hover:bg-primary/90 shrink-0"
                    >
                      {sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
