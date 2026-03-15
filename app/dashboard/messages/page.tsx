"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getConversations,
  subscribeToMessages,
  sendMessage as sendFirestoreMessage,
  getOrCreateConversation,
} from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import type { Conversation, Message } from "@/app/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const { user, userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const convos = await getConversations(user!.uid);
        setConversations(convos);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Subscribe to messages when a conversation is selected
  useEffect(() => {
    if (!selectedConvo) return;
    const unsub = subscribeToMessages(selectedConvo.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsub;
  }, [selectedConvo]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !userProfile || !selectedConvo) return;
    setSending(true);
    try {
      await sendFirestoreMessage(
        selectedConvo.id,
        user.uid,
        userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
        newMessage
      );
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getOtherName = (convo: Conversation) => {
    if (!user) return "";
    const otherId = convo.participants.find((p) => p !== user.uid);
    return otherId ? convo.participantNames[otherId] || "User" : "User";
  };

  const getOtherAvatar = (convo: Conversation) => {
    if (!user) return "";
    const otherId = convo.participants.find((p) => p !== user.uid);
    return otherId ? convo.participantAvatars?.[otherId] || getOtherName(convo)[0] : "U";
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="h-full flex flex-col min-h-0 pb-6">
      <motion.div className="mb-4 sm:mb-6 shrink-0" variants={fadeInUp}>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Messages</h1>
        <p className="text-sm sm:text-base text-gray-500">Your conversations with clients and freelancers.</p>
      </motion.div>

      <motion.div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0 shadow-sm"
        variants={staggerItem}
      >
        <div className="flex flex-1 min-h-0">
          {/* Conversation List */}
          <div className={`${selectedConvo ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-72 md:w-80 border-r border-gray-100 shrink-0 h-full min-h-0`}>
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</h2>
            </div>
            {conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
                <MessageSquare size={32} className="mb-2 opacity-40" />
                <p className="text-xs text-center">No conversations yet.<br />Start one from a project or profile.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      selectedConvo?.id === convo.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {getOtherAvatar(convo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{getOtherName(convo)}</p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {convo.lastMessageAt?.toDate ? timeAgo(convo.lastMessageAt.toDate()) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{convo.lastMessage || "No messages yet"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className={`${selectedConvo ? "flex" : "hidden sm:flex"} flex-col flex-1`}>
            {selectedConvo ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="sm:hidden p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                    {getOtherAvatar(selectedConvo)}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{getOtherName(selectedConvo)}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      <p className="text-xs">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.uid;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl ${isMe ? "bg-teal-500 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-teal-100" : "text-gray-400"}`}>
                              {msg.createdAt?.toDate ? timeAgo(msg.createdAt.toDate()) : "Now"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="shrink-0 px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="w-10 h-10 flex items-center justify-center bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-40 shrink-0"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Send size={16} />
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageSquare size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-gray-500">Select a conversation</p>
                <p className="text-xs text-gray-400 mt-1">Choose a conversation from the list to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
