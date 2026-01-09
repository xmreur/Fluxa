import { motion } from "framer-motion"
import * as lucide from 'react-icons/lu'
import { SearchBar } from "../SearchBar"

export const DashboardToolbar = ({ searchQuery, setSearchQuery, hasTeam }) => {
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between gap-4 mb-6"
        >
            <div className="flex-1 max-w-[65%]">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            <button
                onClick={() => {}}
                className="h-10 px-4  bg-cyan-500 text-slate-900 cursor-pointer hover:bg-cyan-600 justify-center items-center flex py-3 rounded-xl"
            >
                <lucide.LuPlus className="h-4 w-4 mr-2" />
                {hasTeam ? 'New Issue' : 'New Team'}
            </button>
        </motion.div>
    )
}