import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useVideoStore = create(
    persist(
        (set, get) => ({
            selectedVideo: null,
            videos: [],

            setVideos: (videos) => set((state) => ({
                videos
            })),

            setSelectedVideo: (selectedVideo) => set((state) => ({
                selectedVideo
            })),

            addVideo: (
                videoId,
                videoData
            ) => set((state) => ({
                currentEvents: [
                    ...state.currentEvents,
                    { videoId, videoData }
                ]
            })),

            getEventById: (videoId) => {
                const video = get().videos.find(video => video.videoId === videoId);
                return video || null;
            },

            resetUserData: () => set({}, true)
        }),
        {
            name: "videos-data-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
);

export default useVideoStore;