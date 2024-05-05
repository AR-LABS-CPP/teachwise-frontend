import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaUpload } from "react-icons/fa6";
import { MdOutlineReport } from "react-icons/md";
import { FaArrowCircleRight } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import MessageBox from "./components/MessageBox"
import axiosInstance from "./http/axiosInstance";
import useVideoStore from "./store/useVideoStore";
import useChatStore from "./store/useChatStore";
import { generate } from "short-uuid";
import FormData from "form-data";
import Swal from "sweetalert2";

export default function App() {
    const [backendStatus, setBackendStatus] = useState("Fetching")
    const [backendStatusColor, setBackendStatusColor] = useState("bg-orange-500")
    const [prompt, setPrompt] = useState("")
    const [messages, setMessages] = useState([])
    const [responseInProgress, setResponseInProgress] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [selectedFile, setSelectedFile] = useState(null)

    const { selectedVideo, setSelectedVideo, setVideos, videos } = useVideoStore()
    const { getVideoChatMessages, chatMessages, addChatMessage } = useChatStore()

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 1) {
            toast.error("You can only select one video at a time")
        }
        else {
            setSelectedFile(acceptedFiles[0])
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    const heartBeat = async () => {
        try {
            await axiosInstance.get("/heartbeat")
            setBackendStatus("Active")
            setBackendStatusColor("bg-green-500")
        }
        catch (err) {
            console.error(err)

            setBackendStatus("Down")
            setBackendStatusColor("bg-red-600")
        }
    }

    const fetchVideos = async () => {
        try {
            const res = await axiosInstance.get(
                `/videos/${import.meta.env.VITE_TWELVE_LABS_VIDEO_INDEX_ID}`
            )

            if (res.status === 200) {
                setVideos(res.data)
            }
        }
        catch (err) {
            console.error(err)
        }
    }

    const getResponse = async () => {
        try {
            if(prompt === "") {
                toast.error("Please enter something in the prompt!")
                return;
            }

            addChatMessage(
                selectedVideo,
                "USER",
                generate(),
                prompt
            )

            setResponseInProgress(true)

            const modelResponse = await axiosInstance.post(
                `/conversation/${selectedVideo}`,
                {
                    prompt,
                }
            )

            if(modelResponse.status !== 200) {
                setResponseInProgress(false)

                addChatMessage(
                    selectedVideo,
                    "MODEL",
                    generate(),
                    "Something went wrong, please try again"
                )
            }
            else {
                addChatMessage(
                    selectedVideo,
                    "MODEL",
                    modelResponse?.data?.id,
                    modelResponse?.data?.data
                )
            }

            setResponseInProgress(false);

            return "Response";
        }
        catch(err) {
            console.error(err)
            return "Error occurred while getting response, please try again"
        }
    }

    const setVideo = (videoId) => {
        setSelectedVideo(videoId)
    }

    const uploadVideo = async () => {
        try {
            if(Object.keys(selectedFile ?? {})?.length > 0 && youtubeUrl.length > 0) {
                toast.error("You can only upload one file at a time")
                return
            }

            let body = null

            if(Object.keys(selectedFile ?? {})?.length > 0) {
                body = new FormData()
                body.append("videoInputType", "file")
                body.append("videoFile", selectedFile)
            }
            else if(youtubeUrl.length > 0) {
                body = {
                    videoInputType: "url",
                    videoUrl: youtubeUrl
                }
            }

            const response = await axiosInstance.post(
                `/videos/${import.meta.env.VITE_TWELVE_LABS_VIDEO_INDEX_ID}/upload`,
                body,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            )

            if(response.status !== 200) {
                toast.error("Error occurred during video upload, please try again")
                return
            }

            toast.success(`Video uploaded successfully, index building will take at least 2 minutes`)
        }
        catch(err) {
            console.error(err)
            toast.error("Error occurred while uploading video, please try again")
        }
    }

    useEffect(() => {
        Swal.fire({
            title: "Instruction",
            text: `
            Please note that the video upload process takes around 3 minutes,
            so once you start uplooading, wait for the specified time and then
            manually refresh the page to update the videos section. Webhook
            functionality for automatic deliverability was not implemented due to time constraint.
            `,
            icon: "info",
            customClass: {
                content: "text-sm"
            }
        })

        heartBeat()
        fetchVideos()
    }, [])

    useEffect(() => {
        const unsubscribe = useChatStore.subscribe(
            (_) => {
                setMessages(getVideoChatMessages(selectedVideo))
            },
            (state) => state.chatMessages
        )

        setMessages(getVideoChatMessages(selectedVideo))

        console.debug("USE EFFECT TRIGGERED")

        return unsubscribe
    }, [selectedVideo, chatMessages])

    return (
        <div className="min-w-screen min-h-screen bg-slate-200">
            <Toaster
                position="bottom-left"
                richColors
            />
            <header className="flex justify-between w-full h-16 py-5 px-12">
                <div className="flex flex-col">
                    <p className="font-semibold text-2xl text-gray-800">TeachWise</p>
                    <p className="text-sm">Your personal teching style analyzer</p>
                </div>
                <div className="flex space-x-3">
                    <div className="flex justify-center items-center space-x-4 border-[1px] border-gray-400 bg-white shadow-md rounded-full h-10 w-40">
                        <p className="text-xs font-bold">Backend Status</p>
                        <span className={`w-3 h-3 rounded-full ${backendStatusColor}`} title={backendStatus}></span>
                    </div>
                    <div className="flex justify-center items-center space-x-2 border-[1px] border-gray-400 bg-white shadow-md rounded-full h-10 w-40">
                        <p className="text-xs font-bold">Credits Used:</p>
                        <p className="text-xs">0 / 600</p>
                    </div>
                </div>
            </header>
            <div className="mx-10 mt-7 min-h-[85vh] flex space-x-3">
                <div className="flex flex-col space-y-3 flex-1">
                    <div className="space-y-5 p-10 bg-white flex flex-1 flex-col w-full border-[1px] border-gray-400 rounded-lg shadow-md">
                        <div className="flex flex-col space-y-2">
                            <p className="text-sm font-semibold text-gray-700">Upload video by URL</p>
                            <input type="text" className="border-[1px] border-gray-300 px-3 h-8 outline-none" placeholder="youtube link" onChange={(e) => setYoutubeUrl(e.target.value)} />
                        </div>
                        <div
                            className="flex flex-col items-center justify-center border-[2px] border-gray-400 rounded-md border-dashed h-full space-y-3 hover:cursor-pointer hover:bg-gray-50"
                            {...getRootProps()}
                        >
                            <FaUpload size={25} />
                            <input {...getInputProps()} />
                            {
                                isDragActive ? (
                                    <p className="text-xs text-gray-600">Drop the files here ...</p>
                                ) : (
                                    <p className="text-xs text-gray-600">Drag 'n' drop some files here, or click to select files</p>
                                )
                            }
                        </div>
                        <div className="h-8 flex space-x-3 w-full justify-end">
                            <button
                                className="text-sm bg-green-600 hover:bg-green-700 w-28 h-8 rounded-md text-white"
                                onClick={() => setSelectedFile(null)}
                            >
                                Clear files
                            </button>
                            <button
                                className="text-sm bg-green-600 hover:bg-green-700 w-28 h-8 rounded-md text-white"
                                onClick={() => { uploadVideo() }}
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                    <div className="h-[45vh] bg-white border-[1px] border-gray-400 rounded-lg shadow-md p-7">
                        <p className="text-lg font-semibold border-b-[1px] border-gray-300">Your Videos</p>
                        {
                            videos?.length === 0 ? (
                                <div className="w-full h-full flex justify-center items-center">
                                    <p className="text-sm text-gray-700">No video(s) present</p>
                                </div>
                            ) : (
                                <div className="mt-5 h-[90%] overflow-y-auto no-scrollbar grid xl:grid-cols-2 2xl:grid-cols-3 gap-7 place-items-center">
                                    {
                                        videos.map(video => (
                                            <div key={video.created_at} className="relative border-[1px] border-gray-300 shadow-md rounded-lg overflow-hidden w-56 h-56 group">
                                                <img src={video?.hls?.thumbnail_urls[0]} alt={video?.metadata?.filename} className="h-full object-cover" />
                                                <div className="absolute top-0 left-0 w-full h-full bg-white group-hover:bg-gray-800 bg-opacity-50 transition-opacity duration-300 ease-in-out invisible group-hover:visible">
                                                    <div className="w-full h-full flex justify-center items-center">
                                                        <button className="bg-green-500 p-2 rounded-md text-white shadow-md" onClick={() => {
                                                            setVideo(video._id)
                                                            toast.success("Video selected successfully")
                                                        }}>Select Video</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )
                        }
                    </div>
                </div>
                <div className="p-5 h-[85vh] bg-white flex-1 border-[1px] border-gray-400 rounded-lg shadow-md">
                    <div className="w-full border-b-[1px] border-gray-200 shadow-sm flex justify-between items-center p-5">
                        <p className="font-semibold text-xl">Analysis / Conversation</p>
                        <MdOutlineReport size={25} className="text-red-500 hover:text-red-600 hover:cursor-pointer" />
                    </div>
                    <div className="h-[90%] p-7 flex flex-col space-y-4">
                        <div className="space-y-7 flex-1 overflow-y-auto no-scrollbar">
                            <MessageBox text="Hi There! I am TeachWise. I am here to assist you in enhancing your teaching abilities." isResponse={true} />
                            {
                                messages.map(chatMessage => (
                                    <MessageBox key={chatMessage?.messageId} text={chatMessage?.message} isResponse={chatMessage?.role == "MODEL"} />
                                ))
                            }
                            { responseInProgress && <MessageBox text="Thinking...." isResponse={true} /> }
                        </div>
                        <div className="h-16 flex flex-col">
                            <div className="px-3 space-x-3 border-[1px] border-gray-400 shadow-md rounded bg-white w-full lg:w-2/3 self-center h-full flex items-center">
                                <input type="text" className="w-full outline-none" placeholder="Enter your prompt here" onChange={(e) => setPrompt(e.target.value)} />
                                <FaArrowCircleRight size={35} className="text-green-600 hover:cursor-pointer hover:text-green-700" onClick={() => getResponse()} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}