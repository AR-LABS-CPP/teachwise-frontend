import { FaRobot } from "react-icons/fa6";
import { IoPersonSharp } from "react-icons/io5";

export default function MessageBox({ text, isResponse = false }) {
    const cssToApply = isResponse ?
        "w-full xl:w-1/2 border-[1px] p-5 rounded-md bg-white font-semibold text-green-600" :
        "mt-4 w-full xl:w-1/2 border-[1px] p-5 rounded-md bg-green-600 font-semibold text-white text-right"

    return (
        <div className={`px-5 flex flex-col ${!isResponse ? "items-end" : ""} space-y-3`}>
            { isResponse ? <FaRobot size={30} className="text-green-400" /> : <IoPersonSharp size={30} className="text-green-600" /> }
            <p className={cssToApply}>
                { text }
            </p>
        </div>
    );
}