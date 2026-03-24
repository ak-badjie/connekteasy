"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/lib/AuthContext";
import { db } from "@/app/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { subscribeToMessages, sendMessage } from "@/app/lib/firestore";
import { Conversation, Message } from "@/app/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, fadeIn, fadeInUp } from "@/app/lib/animations";
import {
  Search,
  Paperclip,
  Mic,
  Send,
  MoreVertical,
  Briefcase,
  Clock,
  ChevronLeft,
  Phone,
  Video,
  Info,
  Building2,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";

export default function MessagesPage() {
  const { user, userProfile } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "details">("chat");
  const [mobileView, setMobileView] = useState<"contacts" | "content">("contacts");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        convos.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch Messages when a conversation is selected
  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(selectedContactId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedContactId]);

  const selectedConversation = conversations.find((c) => c.id === selectedContactId) || null;

  // Helper to get the *other* user's details
  const getOtherParticipantId = (conv: Conversation) => {
    return conv.participants.find((p) => p !== user?.uid) || conv.participants[0];
  };

  const handleContactClick = (id: string) => {
    setSelectedContactId(id);
    setActiveView("chat");
    setMobileView("content");
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContactId || !user?.uid) return;
    
    const content = messageInput.trim();
    setMessageInput(""); // Clear input early for better UX

    const senderName = userProfile?.firstName 
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : user.displayName || "User";

    try {
      await sendMessage(selectedContactId, user.uid, senderName, content);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const otherId = getOtherParticipantId(c);
    const otherName = c.participantNames[otherId] || "Unknown User";
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-1 min-h-0 w-full bg-white overflow-hidden">
      {/* Sidebar 1: Contacts List (Stiff outer, scrollable inner) */}
      <div
        className={`${
          mobileView === "contacts" ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[320px] border-r border-gray-200 bg-gray-50/30 shrink-0 h-full`}
      >
        {/* Fixed Header & Search */}
        <div className="p-4 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-gray-900">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mustard-500/20 focus:border-mustard-500 transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Scrollable Contacts List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
          {filteredConversations.length === 0 ? (
            <motion.div className="p-4 text-center text-sm text-gray-500" variants={fadeIn}>
              {searchQuery ? "No contacts found." : "No conversations yet."}
            </motion.div>
          ) : (
            <motion.div className="space-y-0.5" initial="hidden" animate="visible" variants={staggerContainer}>
                {filteredConversations.map((contact) => {
                  const otherId = getOtherParticipantId(contact);
                  const otherName = contact.participantNames[otherId] || "Unknown User";
                  const otherAvatar = contact.participantAvatars[otherId] || "/Black_virtual_assistant_202603240435.jpeg";
                  
                  // Format the timestamp roughly
                  const timeString = contact.lastMessageAt?.toDate 
                    ? contact.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : "";

                  return (
                    <motion.button
                        key={contact.id}
                        variants={staggerItem}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleContactClick(contact.id)}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors group ${
                        selectedContactId === contact.id
                            ? "bg-white shadow-sm border border-gray-200"
                            : "hover:bg-gray-100/80 border border-transparent"
                        }`}
                    >
                        <div className="relative shrink-0">
                        <img
                            src={otherAvatar}
                            alt={otherName}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:border-teal-100 transition-colors"
                        />
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-gray-900 truncate">
                            {otherName}
                            </span>
                            <span className="text-xs text-gray-500 font-medium shrink-0">{timeString}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs truncate text-gray-500">
                              {contact.lastMessage || "Started a conversation"}
                            </p>
                        </div>
                        </div>
                    </motion.button>
                  );
                })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Area: Conditionally render Chat, Details, or Empty State */}
      <div
        className={`${
          mobileView === "content" ? "flex" : "hidden"
        } md:flex flex-col flex-1 min-w-0 bg-white h-full relative`}
      >
        {!selectedContactId ? (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-mustard-600" />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Your Messages</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Select a conversation from the sidebar to view details, or start a new chat to connect with talent and clients.
            </p>
          </div>
        ) : activeView === "chat" ? (
          <>
            {/* Fixed Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileView("contacts")}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0 cursor-pointer" onClick={() => setActiveView("details")}>
                  <img
                    src={selectedConversation?.participantAvatars[getOtherParticipantId(selectedConversation!)] || "/Black_virtual_assistant_202603240435.jpeg"}
                    alt="Contact"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 cursor-pointer hover:underline" onClick={() => setActiveView("details")}>
                    {selectedConversation?.participantNames[getOtherParticipantId(selectedConversation!)] || "Unknown User"}
                  </h3>
                  <p className="text-xs text-mustard-600 font-medium">
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button className="p-2 text-gray-500 hover:text-mustard-600 hover:bg-teal-50 rounded-lg transition-colors hidden sm:block">
                  <Phone size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-mustard-600 hover:bg-teal-50 rounded-lg transition-colors hidden sm:block">
                  <Video size={18} />
                </button>
                <button
                  onClick={() => setActiveView("details")}
                  className="p-2 text-gray-500 hover:text-mustard-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <Info size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-mustard-600 hover:bg-teal-50 rounded-lg transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                  <p>No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  // Handle mixed timestamps (Firestore serverTimestamp vs RTDB any)
                  const timeLabel = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={`px-4 py-2.5 shadow-sm break-words whitespace-pre-wrap ${
                            isMe
                              ? "bg-mustard-500 text-gray-900 rounded-2xl rounded-br-sm"
                              : "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 mx-1 font-medium">
                          {timeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-mustard-500 transition-all shadow-sm">
                <button className="p-2 text-gray-500 hover:text-mustard-600 hover:bg-teal-50 rounded-lg transition-colors shrink-0">
                  <Paperclip size={20} />
                </button>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 max-h-32 min-h-[40px] py-2.5 bg-transparent text-sm text-gray-900 placeholder-gray-500 resize-none focus:outline-none"
                  rows={1}
                />
                <div className="flex items-center gap-1 shrink-0 pb-1">
                  <button className="p-2 text-gray-500 hover:text-mustard-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <Mic size={20} />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-mustard-500 text-gray-900 rounded-lg hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-50"
                    disabled={!messageInput.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* DETAILS VIEW (Replaces Chat) */
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-200 shrink-0">
              <button
                onClick={() => setActiveView("chat")}
                className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                <ChevronLeft size={16} />
                Back to Messages
              </button>
              <h2 className="ml-4 text-lg font-bold text-gray-900">Contact Details</h2>
            </div>

            {/* Scrollable Details Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-8 bg-gray-50/30">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start mb-8 pb-8 border-b border-gray-200 text-center md:text-left">
                  <img src={selectedConversation?.participantAvatars[getOtherParticipantId(selectedConversation!)] || "/Black_virtual_assistant_202603240435.jpeg"} alt="Profile" className="w-32 h-32 rounded-2xl object-cover border border-gray-200 shadow-sm" />
                  <div>
                    <h3 className="text-3xl font-display font-bold text-gray-900 mb-1">
                      {selectedConversation?.participantNames[getOtherParticipantId(selectedConversation!)] || "Unknown User"}
                    </h3>
                    <p className="text-gray-500 font-medium mb-4">Virtual Assistant</p>
                    <div className="flex gap-3 justify-center md:justify-start">
                      <button className="flex items-center gap-2 px-4 py-2 bg-mustard-500 text-gray-900 font-semibold rounded-lg hover:bg-mustard-600 transition-colors">
                        <Phone size={16} /> Call
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                        <Video size={16} /> Video
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Project Info */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Related Project</h3>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-2">Remote Administrative Assistant</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Building2 size={16} className="text-gray-400" />
                        <span>TechNova Solutions</span>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg"><Briefcase size={16} className="text-mustard-600" /></div>
                          <div><p className="text-xs text-gray-500">Category</p><p className="text-sm font-semibold text-gray-900">Admin Support</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-mustard-500/20 rounded-lg"><Clock size={16} className="text-mustard-600" /></div>
                          <div><p className="text-xs text-gray-500">Job Type</p><p className="text-sm font-semibold text-gray-900">Full-time Contract</p></div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 mt-8 mb-4 uppercase tracking-wider">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Data Entry", "Calendar Mgmt", "Slack"].map((skill) => (
                        <span key={skill} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-sm">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Shared Media / Files */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Shared Resources</h3>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16} /></div>
                            <div><p className="text-sm font-semibold text-gray-900">Project_Requirements.pdf</p><p className="text-xs text-gray-500">2.4 MB • Sent Yesterday</p></div>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ImageIcon size={16} /></div>
                            <div><p className="text-sm font-semibold text-gray-900">Design_Mockup_V2.png</p><p className="text-xs text-gray-500">4.1 MB • Sent Monday</p></div>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><LinkIcon size={16} /></div>
                            <div><p className="text-sm font-semibold text-gray-900">Figma Prototype Link</p><p className="text-xs text-gray-500">figma.com/file/... • Sent Tuesday</p></div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
