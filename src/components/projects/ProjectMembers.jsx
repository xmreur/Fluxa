import { useState, useEffect } from "react";
import { supabase } from "../../supabase-client";
import * as lucide from "react-icons/lu";
import { motion } from "framer-motion";
import { Card, CardContent } from "../Card";
import { DropdownMenu } from "../DropdownMenu";
import { IoIosMore } from "react-icons/io";
import { Avatar } from "../Avatar";
import { InviteToProjectModal } from "../modals/InviteToProjectModal";
import { ProjectInvitesDropdown } from "./ProjectInvitesDropdown";

export const ProjectMembers = ({
    projectId,
    projectName,
    userRole
}) => {
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState({});
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const capitalize = (str) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    // ---------------- LOAD DATA ----------------

    const loadMembers = async () => {
        setLoading(true);

        const { data: membersData } = await supabase
            .from("project_members")
            .select("user_id, role")
            .eq("project_id", projectId);

        if (!membersData?.length) {
            setMembers([]);
            setLoading(false);
            return;
        }

        const userIds = membersData.map(m => m.user_id);

        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, email, avatar_url")
            .in("id", userIds);

        const merged = profiles.map(profile => {
            const role = membersData.find(m => m.user_id === profile.id)?.role;
            return { ...profile, role };
        });

        setMembers(merged);

        const roleMap = {};
        merged.forEach(m => roleMap[m.id] = m.role);
        setRoles(roleMap);

        setLoading(false);
    };

    const loadInvites = async () => {
        const { data } = await supabase
            .from("invites")
            .select(`
                id,
                invitee_email,
                role,
                created_at
            `)
            .eq("project_id", projectId);

        if (!data) return;

        setInvites(
            data.map(inv => ({
                invite_id: inv.id,
                email: inv.invitee_email,
                role: inv.role,
                created_at: inv.created_at
            }))
        );
    };

    useEffect(() => {
        loadMembers();
        loadInvites();
    }, [projectId]);

    // ---------------- ACTIONS ----------------

    const updateUserRole = async (userId, newRole) => {
        setRoles(prev => ({ ...prev, [userId]: newRole }));

        await supabase
            .from("project_members")
            .update({ role: newRole })
            .eq("user_id", userId)
            .eq("project_id", projectId);

        await loadMembers();
    };

    const removeMember = async (userId) => {
        await supabase
            .from("project_members")
            .delete()
            .eq("project_id", projectId)
            .eq("user_id", userId);

        await loadMembers();
    };

    const revokeInvite = async (inviteId) => {
        await supabase.from("invites").delete().eq("id", inviteId);
        await loadInvites();
    };

    // ---------------- UI ----------------

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <lucide.LuLoaderCircle className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* INVITE BUTTON */}
            {userRole !== "member" && (
                <>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2"
                    >
                        <lucide.LuMailPlus className="h-4 w-4" />
                        Invite member
                    </button>

                    <InviteToProjectModal
                        open={showInviteModal}
                        onClose={() => setShowInviteModal(false)}
                        projectId={projectId}
                        projectName={projectName}
                        onCreate={loadInvites}
                    />
                </>
            )}

            {/* INVITES */}
            <ProjectInvitesDropdown
                invites={invites}
                revokeInvite={revokeInvite}
                userRole={userRole}
            />

            {/* MEMBERS */}
            {members.map((member, index) => (
                <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <Avatar profile={member} className="h-8 w-8" />
                                <div>
                                    <p className="font-medium">{member.username}</p>
                                    <p className="text-sm text-gray-400">{member.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1.5 rounded-full text-xs font-medium
                                    ${member.role === "owner" ? "bg-yellow-500/10 text-yellow-500" :
                                      member.role === "admin" ? "bg-blue-500/10 text-blue-400" :
                                      "bg-gray-600/20 text-gray-400"}`}
                                >
                                    {userRole === "owner" && member.role !== "owner" ? (
                                        <select
                                            value={roles[member.id]}
                                            onChange={e => updateUserRole(member.id, e.target.value)}
                                            className="bg-transparent outline-none cursor-pointer"
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : (
                                        capitalize(member.role)
                                    )}
                                </div>

                                {userRole === "owner" && member.role !== "owner" && (
                                    <DropdownMenu
                                        trigger={
                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700">
                                                <IoIosMore />
                                            </button>
                                        }
                                        items={[
                                            {
                                                label: "Remove",
                                                icon: lucide.LuTrash2,
                                                className: "text-red-500",
                                                onClick: () => removeMember(member.id)
                                            }
                                        ]}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};
