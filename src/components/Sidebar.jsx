import { useLocation, useNavigate } from "react-router"
import { animate, motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { useAuth } from "../context/AuthContext";
import FluxaLogo from "./FluxaLogo";
import { supabase } from "../supabase-client";
import { useState } from "react";
import { SpotlightSearchModal } from "./modals/SpotlightSearchModal";
import { Avatar } from "./Avatar";

const navItems = [
    { icon: lucide.LuLayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: lucide.LuInbox, label: 'My Inbox', path: '/inbox' },
    { icon: lucide.LuFileText, label: 'My Issues', path: '/issues'},
    { icon: lucide.LuFolderKanban, label: 'Projects', path: '/projects' },
    { icon: lucide.LuUsers, label: 'Teams', path: '/teams' },
    { icon: lucide.LuSettings, label: 'Settings', path: '/settings' },
]

export function Sidebar() {

    const location = useLocation();


    const isActive = (path) => location.pathname === path;
    
    const handleLogout = async () => {
        await supabase.auth.signOut({ scope: 'local' });
        navigateTo('/auth', { replace: true });
    };

    const itemVariants = {
        hidden: { x: -10, opacity: 0 },
        visible: (i) => ({
            x: 0,
            opacity: 1,
            transition: {
                delay: i * 0.05,
                duration: 0.2
            }
        })
    };
    
    const {user, profile, loading } = useAuth();
    const navigateTo = useNavigate();

    const [spotlightOpen, setSpotlightOpen] = useState(false);

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
                    onClick={() => setSpotlightOpen(true)}
                    className="w-full bg-transparent border-slate-700 border hover:bg-slate-700 text-gray-400 hover:text-white cursor-pointer justify-start px-4 items-center flex py-3 rounded-xl"
                >
                    <lucide.LuSearch className="h-4 w-4 mr-2" />
                    Search...
                </button>
            </div>
    
            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <motion.button
                            key={item.label}
                            custom={index}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            
                            onClick={() => navigateTo(item.path, { replace: false })}
                            className={`
                                w-full flex items-center cursor-pointer  
                                gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                transition-all mb-1.5 hover:bg-slate-800
                                ${isActive(item.path)
                                    ? 'bg-slate-700/60 text-white '
                                    : 'text-gray-300 hover:text-white '
                                }
                            `}
                        >
                            <Icon className="h-5 w-5 " />
                            <span className="truncate">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* User Profile */}
                <div className="p-4 border-t border-gray-500 ">
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-900/50 backdrop-blur-sm animate-pulse shadow-lg" />
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="h-4 w-24 rounded-full bg-indigo-900/30 animate-pulse" />
                                <div className="h-3 w-32 rounded-full bg-indigo-900/20 animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 group">
                            <div className="relative">
                                <Avatar className="h-10 w-10" profile={profile} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {profile?.username || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate max-w-30">
                                            {profile?.email}
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ duration: 0.05 }}
                                        onClick={handleLogout}
                                        className="p-1.5 cursor-pointer rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                                        title="Sign out"
                                    >
                                        <lucide.LuLogOut className="h-4 w-4" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            
            <SpotlightSearchModal user={user} open={spotlightOpen} onOpenChange={setSpotlightOpen} />
        </motion.aside>
    )
}