import { motion } from "framer-motion";

import { formatDistanceToNow } from "date-fns";

export const IssueCard = ({ issue, index, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onClick={onClick}
            className="group rounded-lg p-4 cursor-pointer hover-lift hover:border-slate-700/30"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 font-mono">
                            FLX-{issue.id.slice(-12).toUpperCase()}
                        </span>

                        {issue.priority === 3 //TODO: REPLACE WITH UI 
                        ? 'Medium Priority'
                        : 
                        issue.priority < 3
                        ? 'Low Priority'
                        : 'High Priority'
                        }
                    </div>

                    <h3 className="font-medium text-gray-100 group-hover:text-white transition-colors truncate">
                        {issue.title}
                    </h3>

                    {issue.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {issue.description}
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span>Type: {issue.type}</span> {/* //TODO: REPLACE WITH UI */}
                        <span>Active: {issue.is_active}</span> {/* //TODO: REPLACE WITH UI */}
                    </div>
                </div>

                <div className="text-xs text-gray-400 whitespace-nowrap">
                    {console.log(issue)}
                    {formatDistanceToNow(issue.created_at, { addSuffix: true })}
                </div>
            </div>
        </motion.div>
    )
} 