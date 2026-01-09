import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { Card, CardContent } from "../Card";
import { supabase } from "../../supabase-client";
import { useState } from "react";

export const TeamMemberList = ({ userRole, teamId, members, capitalizeFirstLetter }) => {

    const updateUserRole = async (userId, teamId, newRole) => {
        if (!['member', 'admin'].includes(newRole)) return;

        const { error } = await supabase.from('team_members')
            .update({ role: newRole })
            .eq('user_id', userId)
            .eq('team_id', teamId);

        if (error) {
            console.error("Failed to update role:", error.message);
        }
    }

    return (
        <div className="space-y-3">
            {members.map((member, index) => {
                const [selectedRole, setSelectedRole] = useState(member.role);

                const handleRoleChange = async (e) => {
                    const newRole = e.target.value;
                    setSelectedRole(newRole);
                    await updateUserRole(member.id, teamId, newRole);
                };

                return (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                    >
                        <Card className="hover:border-blue-500/50 transition-colors">
                            <CardContent className="mt-5 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {member.avatar_url ? (
                                        <img
                                            src={member.avatar_url}
                                            alt={member.username}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold">
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div>
                                        <p className="font-medium">{member.username}</p>
                                        <p className="text-sm text-gray-400 flex items-center gap-1">
                                            <lucide.LuMail className="h-3.5 w-3.5" />
                                            {member.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {member.issue_amount} issues
                                        </p>
                                        <p className="text-xs text-gray-400">Created or Assigned</p>
                                    </div>

                                    <div className="flex items-center gap-2">
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

                                            {/* Role text or editable select */}
                                            {userRole === "owner" && member.role !== "owner" ? (
                                                <select
                                                    value={selectedRole}
                                                    onChange={handleRoleChange}
                                                    className="ml-1 bg-transparent text-white text-xs font-medium border-none outline-none cursor-pointer"
                                                >
                                                    <option value="member" className="bg-slate-700">Member</option>
                                                    <option value="admin" className="bg-slate-700">Admin</option>
                                                </select>
                                            ) : (
                                                <span className="ml-1">{capitalizeFirstLetter(member.role)}</span>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            })}
        </div>
    );
};
