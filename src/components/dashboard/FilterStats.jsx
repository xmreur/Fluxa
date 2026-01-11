import { motion } from "framer-motion"
import * as lucide from 'react-icons/lu'

export const FilterTabs = ({ activeFilter, onFilterChange, filters = [], counts = {} }) => {

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg overflow-x-auto overflow-y-hidden">
            {filters.length > 0 
            ? filters.map((filter) => {
                const Icon = lucide.LuTag;
                const isActive = activeFilter === filter.id;

                return (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`relative flex items-center w-fit gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                            isActive ? `text-[${filter.color}]` : 'text-gray-400 hover:text-white/80'
                        }`}
                    >
                        {isActive && (
                            <motion.div 
                                layoutId='activeFilter'
                                className="absolute inset-0 bg-slate-950/80 rounded-md shadow-sm"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: filter.color }} />
                            <span className="truncate max-w-30">{filter.name}</span>
                            <span className={`text-xs ${isActive ? 'text-gray-400' : 'text-gray-400/60'}`}>
                                {counts[filter.id] || 0}
                            </span>
                        </span>
                    </button>
                )
            })
            : (
                <button
                    key='no-labels'
                    onClick={() => onFilterChange(null)}
                    className="relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-400 hover:text-white/80 whitespace-nowrap"
                >
                    <motion.div 
                        layoutId='activeFilter'
                        className="absolute inset-0 bg-slate-950/80 rounded-md shadow-sm"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                    <span className="relative flex items-center gap-2">
                        <lucide.LuShieldQuestion className="h-4 w-4" />
                        NO LABELS FOUND
                    </span>
                </button>
            )}
        </div>
    )
}
