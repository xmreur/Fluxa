import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as lucide from "react-icons/lu";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { CreateTeamModal } from "../components/modals/CreateTeamModal";
import { InviteToTeamModal } from "../components/modals/InviteToTeamModal";
import TeamInvitesDropdown from "../components/teams/TeamInvitesDropdown";
import { TeamMemberList } from "../components/teams/MembersList";

export const Teams = () => {
    const [teams, setTeams] = useState([]);
    const { user, profile, loading } = useAuth();
    const [dataLoading, setDataLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showInviteModalTeam, setShowInviteModalTeam] = useState(null);



    function capitalizeFirstLetter(string) {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const fetchData = async () => {
        if (!user?.id) return [];

        try {
            // 0️⃣ Get team IDs for current user
            const { data: teamMemberships, error: teamMembershipsError } = await supabase
                .from("team_members")
                .select("team_id")
                .eq("user_id", user.id);

            if (teamMembershipsError) throw teamMembershipsError;

            const teamIds = teamMemberships.map(t => t.team_id);
            if (!teamIds.length) return [];

            // 1️⃣ Parallel fetch: teams, members, issues, invites
            const [
                { data: teamsData, error: teamsError },
                { data: membersData, error: membersError },
                { data: issuesData, error: issuesError },
                { data: invitesData, error: invitesError }
            ] = await Promise.all([
                supabase.from("teams").select("id, name, description").in("id", teamIds),
                supabase.from("team_members").select("team_id, user_id, role").in("team_id", teamIds),
                supabase.from("issues").select("created_by, assigned_to"),
                supabase.from("invites").select("id, team_id, invitee_email, role, created_at").in("team_id", teamIds)
            ]);

            if (teamsError) throw teamsError;
            if (membersError) throw membersError;
            if (issuesError) throw issuesError;
            if (invitesError) throw invitesError;

            // Capture CURRENT USER role per team
            const myRoleByTeam = {};
            membersData.forEach(m => {
                if (m.user_id === user.id) myRoleByTeam[m.team_id] = m.role;
            });

            const userIds = [...new Set(membersData.map(m => m.user_id))];

            // 2️⃣ Parallel fetch: profiles for members and invited emails
            const inviteEmails = [...new Set(invitesData.map(invite => invite.invitee_email))];

            const [{ data: profilesData, error: profilesError }, { data: inviteProfilesData, error: inviteProfilesError }] =
                await Promise.all([
                    supabase.from("profiles").select("id, username, email, avatar_url").in("id", userIds),
                    inviteEmails.length > 0
                        ? supabase.from("profiles").select("id, username, email, avatar_url").in("email", inviteEmails)
                        : Promise.resolve({ data: [], error: null })
                ]);

            if (profilesError) throw profilesError;
            if (inviteProfilesError) throw inviteProfilesError;

            // 3️⃣ Build helper maps
            const profileMap = Object.fromEntries(profilesData.map(p => [p.id, p]));
            const inviteProfileMap = Object.fromEntries(inviteProfilesData.map(p => [p.email, p]));

            const issueCountByUser = {};
            issuesData.forEach(issue => {
                if (issue.created_by) issueCountByUser[issue.created_by] = (issueCountByUser[issue.created_by] || 0) + 1;
                if (issue.assigned_to) issueCountByUser[issue.assigned_to] = (issueCountByUser[issue.assigned_to] || 0) + 1;
            });

            // 4️⃣ Build invites by team
            const invitesByTeam = {};
            invitesData.forEach(invite => {
                if (!invitesByTeam[invite.team_id]) invitesByTeam[invite.team_id] = [];
                const profile = inviteProfileMap[invite.invitee_email];
                invitesByTeam[invite.team_id].push({
                    invite_id: invite.id,
                    id: profile?.id || null,
                    username: profile?.username || null,
                    email: invite.invitee_email,
                    avatar_url: profile?.avatar_url || null,
                    role: invite.role,
                    created_at: invite.created_at
                });
            });

            // 5️⃣ Build teams with members
            const teams = teamsData.map(team => ({
                id: team.id,
                name: team.name,
                description: team.description,
                role: myRoleByTeam[team.id] || "member",
                members: [],
                invites: invitesByTeam[team.id] || []
            }));

            const teamMap = Object.fromEntries(teams.map(team => [team.id, team]));

            membersData.forEach(member => {
                const profile = profileMap[member.user_id];
                const team = teamMap[member.team_id];
                if (!profile || !team) return;

                team.members.push({
                    id: member.user_id,
                    role: member.role,
                    username: profile.username,
                    email: profile.email,
                    avatar_url: profile.avatar_url,
                    issue_amount: issueCountByUser[member.user_id] || 0
                });
            });

            return teams;

        } catch (e) {
            console.error("Failed to fetch teams data:", e);
            return [];
        }
    };


    useEffect(() => {
        if (loading) return;

        if (!user) {
            setTeams([]);
            setDataLoading(false);
            return;
        }

        const load = async () => {
            setDataLoading(true);
            const data = await fetchData();
            setTeams(data);
            setDataLoading(false);
        };

        load();
    }, [user, loading]);

    const updateData = async () => {
        const updatedTeams = await fetchData();
        setTeams(updatedTeams);
    }

    const revokeInvite = async (invite_id) => {
        const { error: deleteError } = await supabase.from('invites').delete().eq('id', invite_id);

        if (deleteError) { console.error(deleteError.message) }
        await updateData();
    }

    const removeMember = async (member_id, team_id) => {
        const { error: deleteError } = await supabase.from('team_members').delete().eq('team_id', team_id).eq('user_id', member_id);

        if (deleteError) { console.error(deleteError.message) }
        await updateData();
    }


    if (loading || dataLoading) {
        return (
            <span className="w-full animate-spin text-gray-400 flex justify-center items-center">
                <lucide.LuLoaderCircle className="h-12 w-12" />
            </span>
        )
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-full"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/15">
                            <lucide.LuUsers className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Teams</h1>
                            <p className="text-gray-400">
                                Manage your teams, members and roles.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2"
                    >
                        <lucide.LuPlus className="h-4 w-4" />
                        Create Team
                    </button>
                </div>

                {/* Teams */}
                <div className="space-y-8">
                    {teams.map((team, teamIndex) => (
                        <div key={team.id} id={team.id} className="flex flex-col gap-3">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: teamIndex * 0.1 }}

                                className="flex justify-between items-center"
                            >
                                <div className="flex flex-col">
                                    <motion.h2
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: teamIndex * 0.1 }}
                                        className="text-xl font-semibold flex gap-1 items-end justify-start text-white"
                                    >
                                        {team.name}
                                        <span className="ml-2 text-sm text-gray-400">
                                            ({capitalizeFirstLetter(team.role)})
                                        </span>
                                    </motion.h2>
                                    <span className="text-xs text-gray-400">{team.description}</span>
                                </div>

                                {team.role !== 'member' && (
                                    <>
                                        <button
                                            onClick={() => setShowInviteModalTeam(team.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2"
                                        >
                                            <lucide.LuMailPlus className="h-4 w-4" />
                                            Invite Member
                                        </button>

                                        <InviteToTeamModal
                                            open={showInviteModalTeam === team.id}
                                            onClose={() => setShowInviteModalTeam(null)}
                                            onCreate={updateData}
                                            teamId={team.id}
                                            teamName={team.name}
                                        />
                                    </>
                                )}
                            </motion.div>

                            <TeamMemberList userRole={team.role} teamId={team.id} members={team.members} capitalizeFirstLetter={capitalizeFirstLetter} onUpdate={updateData} removeMember={removeMember} />

                            {team.invites.length > 0 && (
                                <TeamInvitesDropdown
                                    invites={team.invites}
                                    revokeInvite={revokeInvite}
                                    userRole={team.role}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            <div>
                <CreateTeamModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={updateData}
                    user={user}
                />
            </div>
        </>
    );
};
