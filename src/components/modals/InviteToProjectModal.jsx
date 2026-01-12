import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import * as lucide from "react-icons/lu";
import { motion } from "framer-motion";
import { Select } from "../Select";
import { Avatar } from "../Avatar";

export const InviteToProjectModal = ({
    open,
    onClose,
    projectId,
    projectName,
    onCreate
}) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [role, setRole] = useState("member");
    const [loading, setLoading] = useState(false);

    // 🔹 LOAD USERS THAT ARE NOT ALREADY IN PROJECT
    useEffect(() => {
        if (!open) return;

        const loadEligibleUsers = async () => {
            setLoading(true);

            // 1️⃣ get project → team_id
            const { data: project } = await supabase
                .from("projects")
                .select("team_id")
                .eq("id", projectId)
                .single();

            if (!project?.team_id) {
                setUsers([]);
                setLoading(false);
                return;
            }

            // 2️⃣ get users already in project
            const { data: projectMembers } = await supabase
                .from("project_members")
                .select("user_id")
                .eq("project_id", projectId);

            const projectMemberIds = projectMembers?.map(m => m.user_id) || [];

            // 3️⃣ get all team members
            const { data: teamMembers } = await supabase
                .from("team_members")
                .select("user_id")
                .eq("team_id", project.team_id);

            if (!teamMembers?.length) {
                setUsers([]);
                setLoading(false);
                return;
            }

            const teamUserIds = teamMembers.map(m => m.user_id);

            // 4️⃣ exclude users already in project
            const eligibleUserIds = teamUserIds.filter(
                id => !projectMemberIds.includes(id)
            );

            if (!eligibleUserIds.length) {
                setUsers([]);
                setLoading(false);
                return;
            }

            // 5️⃣ fetch profiles
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, username, email, avatar_url")
                .in("id", eligibleUserIds);

            setUsers(profiles || []);
            setLoading(false);
        };

        loadEligibleUsers();
    }, [open, projectId]);

    // ---------------- INVITE ----------------

    const invite = async () => {
        if (!selectedUser) return;

        await supabase.from("invites").insert({
            project_id: projectId,
            invitee_email: selectedUser.email,
            role
        });

        setSelectedUser(null);
        setRole("member");
        onCreate?.();
        onClose();
    };

    if (!open) return null;

    // ---------------- UI ----------------

    return (
        <motion.div className="fixed inset-0 text-white bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 p-6 rounded-xl w-full max-w-md space-y-4"
            >
                <h2 className="text-lg font-semibold">
                    Invite to {projectName}
                </h2>

                {/* USER SELECT */}
                <Select
                    value={selectedUser?.id}
                    onValueChange={(id) =>
                        setSelectedUser(users.find(u => u.id === id))
                    }
                    placeholder={
                        loading
                            ? "Loading users..."
                            : users.length
                                ? "Select user"
                                : "No users available"
                    }
                    items={users.map(user => ({
                        value: user.id,
                        label: user.username,
                        icon: () => (
                            <Avatar
                                profile={user}
                                className="h-4 w-4"
                            />
                        )
                    }))}
                />

                {/* ROLE SELECT */}
                <Select
                    value={role}
                    onValueChange={setRole}
                    items={[
                        { value: "member", label: "Member", icon: lucide.LuUser },
                        { value: "admin", label: "Admin", icon: lucide.LuShield }
                    ]}
                />

                {/* ACTIONS */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={invite}
                        disabled={!selectedUser}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-all px-4 py-2 rounded"
                    >
                        Invite
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
