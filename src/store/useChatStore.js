import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useChatStore = create(
    persist(
        (set, get) => ({
            chatMessages: [],
            
            addChatMessage: (videoId, role, messageId, message) => set((state) => ({
                chatMessages: [
                    ...state.chatMessages,
                    { videoId, role, messageId, message }
                ]
            })),

            addChatMessages: (newChatMessages) => set((state) => ({
                chatMessages: [
                    ...state.chatMessages,
                    ...newChatMessages
                ]
            })),

            removeChatMessage: (messageId) => set((state) => ({
                chatMessages: state.chatMessages.filter((chatMessage) =>
                    chatMessage.messageId != messageId
                )
            })),

            updateChatMessage: (messageId, text) => set((state) => ({
                chatMessages: state.chatMessages.map((chatMessage) => {
                    if(chatMessage.messageId == messageId) {
                        return { ...chatMessage, message: text }
                    }
                    else {
                        return chatMessage
                    }
                })
            })),

            getVideoChatMessages: (videoId) => {
                return get().chatMessages.filter(chatMessage => chatMessage.videoId == videoId)
            }
        }),
        {
            name: "chat-messages-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
);

export default useChatStore;