import { useEffect, useState } from "react"
import { supabase } from "../../supabase-client"
import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';

const statItems = [
    {
        key: 'teams', label: 'My Teams', icon: lucide.LuUsers, color: 'from-purple-500/40 to-purple-500/10 border-purple-500/20', textColor: 'text-purple-400', spin: false
    },
    {
        key: 'projects', label: 'My Projects', icon: lucide.LuFolderKanban, color: 'from-blue-500/40 to-blue-500/10 border-blue-500/20', textColor: 'text-blue-400', spin: false
    },
    {
        key: 'openIssues', label: 'My Issues', icon: lucide.LuLoaderCircle, color: 'from-amber-500/40 to-amber-500/10 border-amber-500/20', textColor: 'text-amber-400', spin: true
    },
    {
        key: 'completedIssues', label: 'Completed', icon: lucide.LuCircleCheck, color: 'from-green-500/40 to-green-500/10 border-green-500/20', textColor: 'text-green-400', spin: false
    }
]
export const DashboardQuickStats = ({ loading, stats }) => {


    if (loading) {
        return (
            <div className="min-w-md flex justify-center items-center h-23.5">
                <lucide.LuLoaderCircle className="animate-spin h-12 w-12 text-gray-400" />
            </div>
        )
    }
    return (
        <div className="flex flex-col md:flex-row justify-center items-center flew-wrap gap-4">
            {statItems.map((item, idx) => {
                const Icon = item.icon
                const value = stats[item.key] || []
                
                return (
                    <motion.div
                        key={item.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`rounded-xl w-full md:max-w-1/4 border bg-linear-to-b ${item.color} p-4`}
                    >
                        <div className="flex items-center justify-between">
                            <Icon className={`h-5 w-5 ${item.textColor} ${item.spin ? 'animate-spin' : ''}`} />
                            <span className={`text-2xl font-semibold ${item.textColor}`}>
                                {value.length}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-semibold">{item.label}</p>
                    </motion.div>
                )
            })
            }
        </div>
    )
}