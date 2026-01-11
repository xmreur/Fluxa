import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as lucide from "react-icons/lu";
import { Card, CardContent } from "../../components/Card";

const TeamInvitesDropdown = ({ invites, revokeInvite, userRole }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="">
            {/* Dropdown Header */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white font-medium"
            >
                <span>Pending Invites ({invites.length})</span>
                <lucide.LuChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2 space-y-3"
                    >
                        {invites.map((member, index) => (
                            <motion.div
                                key={member.invite_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:border-blue-500/50 transition-colors">
                                    <CardContent className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {member.avatar_url ? (
                                                <img
                                                    src={member.avatar_url}
                                                    alt={member.username}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold">
                                                    {member.username
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-medium">
                                                    {member.username}
                                                </p>
                                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                                    <lucide.LuMail className="h-3.5 w-3.5" />
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col gap-2">
                                                <p className="text-white text-sm text-center">Will join as:</p>
                                                <div
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                                        member.role === "owner"
                                                            ? "bg-yellow-500/10 text-yellow-600"
                                                            : member.role === "admin"
                                                            ? "bg-blue-500/15 text-blue-400"
                                                            : "bg-gray-600/20 text-gray-400"
                                                    }`}
                                                >
                                                    {member.role === "owner" ? (
                                                        <lucide.LuCrown className="h-3.5 w-3.5" />
                                                    ) : member.role === "admin" ? (
                                                        <lucide.LuShield className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <lucide.LuUser className="h-3.5 w-3.5" />
                                                    )}
                                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                </div>
                                            </div>

                                            <div
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/30 text-green-600`}
                                            >
                                                <lucide.LuClock className="h-3.5 w-3.5" />   
                                                Pending              
                                            </div>
                                            
                                            {userRole === 'owner' && (
                                                <div
                                                    onClick={async () => { await revokeInvite(member.invite_id) }}
                                                    className="p-2 cursor-pointer rounded text-red-700 hover:bg-red-600 inline-flex hover:text-slate-950 items-center justify-center"
                                                >
                                                    <lucide.LuX className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamInvitesDropdown;
