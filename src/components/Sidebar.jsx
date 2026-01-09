import { useLocation, useNavigate } from "react-router"
import { animate, motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { useAuth } from "../context/AuthContext";
import FluxaLogo from "./FluxaLogo";
import { supabase } from "../supabase-client";

const navItems = [
    { icon: lucide.LuLayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: lucide.LuInbox, label: 'My Issues', path: '/issues' },
    { icon: lucide.LuFolderKanban, label: 'Projects', path: '/projects' },
    { icon: lucide.LuUsers, label: 'Teams', path: '/teams' },
    { icon: lucide.LuSettings, label: 'Settings', path: '/settings' },
]

export function Sidebar() {

    const location = useLocation();

    const isActive = (path) => {
        return path === location;
    } 

    const {user, profile, loading } = useAuth();
    const navigateTo = useNavigate();

    return (

        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 max-h-svh bg-slate-900 border-r border-gray-500 flex flex-col"
        >
            {/* Logo */}
            <div className="p-4 border-b border-gray-500">
                <FluxaLogo />
            </div>
    
            <div className="p-4">
                <button
                    onClick={() => {}}
                    className="w-full bg-cyan-500 hover:bg-cyan-300 justify-center items-center flex py-3 rounded-xl"
                >
                    <lucide.LuPlus className="h-4 w-4 mr-2" />
                    New Issue
                </button>
            </div>
    
            {/* Navigation */}
            <nav className="flex-1 px-2">
                {
                    navItems.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <motion.button
                                key={item.label}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                onClick={() => navigateTo(item.path, { replace: false })}
                                transition={{ delay: index * 0.05 }}
                                className={`w-full flex items-center cursor-pointer hover:bg-slate-700 gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                                    isActive(item.path)
                                        ? 'bg-slate-600 text-white'
                                        : 'text-gray-400' 
                                }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </motion.button>
                        )
                    })
                }
            </nav>

            {/* User */}
            {
                loading ?
                    <div className="p-4 border-t border-gray-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-700 animate-pulse"></div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="h-4 w-24 rounded-full bg-gray-700 animate-pulse"></div>
                                <div className="h-3 w-32 rounded-full bg-gray-700 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                :
                    <div className="p-4 border-t border-gray-500">
                        <div className="flex items-center gap-3">
                            {
                                profile.avatar_url ?
                                <img className="w-8 h-8 text-white font-bold rounded-full bg-indigo-700 flex items-center justify-center" src={profile.avatar_url} alt={profile.username} />
                                :
                                <div className="w-8 h-8 text-white font-bold rounded-full bg-indigo-700 flex items-center justify-center">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            }
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-white truncate">{profile.username}</p>
                                        <p className="text-xs text-gray-400 truncated">{profile.email}</p>
                                    </div>
                                    <div onClick={async (e) => { await supabase.auth.signOut({ scope: 'local' })}} className="p-2 cursor-pointer rounded text-red-700 hover:bg-red-600 inline-flex hover:text-slate-950 items-center justify-center">
                                        <lucide.LuLogOut className="h-5 w-5  " />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            }
    
        </motion.aside>
    )
}