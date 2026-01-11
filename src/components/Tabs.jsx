import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { LayoutGroup } from "framer-motion"; // For shared layoutId

export const Tabs = ({
    activeTab,
    onTabChange,
    tabs = [],
    counts = {},
    noCount = false,
    emptyTab = null // { icon: LuShieldQuestion, label: 'No Labels', value: 'none' }
}) => {
    return (
        <LayoutGroup id="tabs"> {/* Sync layoutId across renders */}
            <div className="flex select-none items-center gap-1 p-1 bg-slate-700/50 rounded-lg max-w-fit">
                {tabs.length > 0 ? (
                    tabs.map((tab) => {
                        const Icon = tab.icon || lucide.LuTag;
                        const isActive = activeTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => onTabChange(tab.value)}
                                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? `text-[${tab.color}]` : 'text-gray-400 hover:text-white/80'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab" // Fixed: consistent ID
                                        className="absolute inset-0 bg-slate-950/80 rounded-md shadow-sm"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <span className={`relative cursor-pointer flex ${isActive ? 'text-white' : 'text-gray-400/60'} items-center gap-1 z-10`}>
                                    <Icon className="h-4 w-4" style={{ color: tab.color }} />
                                    {tab.name}
                                    {!noCount && (
                                        <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-400/60'}`}>
                                            ({counts[tab.value] || 0})
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })
                ) : emptyTab ? (
                    <button
                        key={emptyTab.value}
                        onClick={() => onTabChange(emptyTab.value)}
                        className="relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-400 hover:text-white/80"
                    >
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-slate-950/80 rounded-md shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                        <span className="relative flex items-center gap-2 z-10">
                            <emptyTab.icon className="h-4 w-4 text-gray-400" />
                            {emptyTab.label}
                        </span>
                    </button>
                ) : null}
            </div>
        </LayoutGroup>
    );
};
