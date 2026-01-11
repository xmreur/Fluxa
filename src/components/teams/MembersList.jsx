import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { Card, CardContent } from "../Card";
import { supabase } from "../../supabase-client";
import { useState, useEffect } from "react";
import { Avatar } from "../Avatar";

export const TeamMemberList = ({ userRole, teamId, members, capitalizeFirstLetter, onUpdate, removeMember }) => {

    // 1️⃣ State for all member roles
    const [roles, setRoles] = useState({});

    // 2️⃣ Initialize roles when members change
    useEffect(() => {
        const initialRoles = {};
        members.forEach(member => {
            initialRoles[member.id] = member.role;
        });
        setRoles(initialRoles);
    }, [members]);

    const updateUserRole = async (userId, teamId, newRole) => {
        if (!['member', 'admin'].includes(newRole)) return;

        const { error } = await supabase.from('team_members')
            .update({ role: newRole })
            .eq('user_id', userId)
            .eq('team_id', teamId);

        if (error) console.error("Failed to update role:", error.message);
    }

    const handleRoleChange = async (memberId, e) => {
        const newRole = e.target.value;
        setRoles(prev => ({ ...prev, [memberId]: newRole }));
        await updateUserRole(memberId, teamId, newRole);
        await onUpdate();
    }

    return (
        <div className="space-y-3">
            {members.map((member, index) => (
                <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                >
                    <Card className="hover:border-blue-500/50 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar profile={member} className="h-8 w-8" />
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
                                    <p className="text-sm font-medium">{member.issue_amount} issues</p>
                                    <p className="text-xs text-gray-400">Created or Assigned</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                        ${member.role === "owner" ? "bg-yellow-500/10 text-yellow-600" :
                                          member.role === "admin" ? "bg-blue-500/15 text-blue-400" :
                                          "bg-gray-600/20 text-gray-400"}`}>
                                        
                                        {member.role === "owner" ? <lucide.LuCrown className="h-3.5 w-3.5" /> :
                                         member.role === "admin" ? <lucide.LuShield className="h-3.5 w-3.5" /> :
                                         <lucide.LuUser className="h-3.5 w-3.5" />}

                                        {userRole === "owner" && member.role !== "owner" ? (
                                            <select
                                                value={roles[member.id]}
                                                onChange={(e) => handleRoleChange(member.id, e)}
                                                className="ml-1 text-white bg-transparent  open:bg-slate-700 text-xs font-medium border-none outline-none cursor-pointer"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className="ml-1">{capitalizeFirstLetter(member.role)}</span>
                                        )}
                                    </div>

                                    {userRole === 'owner' && member.role !== 'owner' && (
                                        <div
                                            onClick={async () => { await removeMember(member.id, teamId); await onUpdate() }}
                                            className="p-2 cursor-pointer rounded text-red-700 hover:bg-red-600 inline-flex hover:text-slate-950 items-center justify-center"
                                        >
                                            <lucide.LuX className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};
