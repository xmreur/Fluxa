import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as lucide from "react-icons/lu";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { CreateTeamModal } from "../components/modals/CreateTeamModal";
import { InviteToTeamModal } from "../components/modals/InviteToTeamModal";
import TeamInvitesDropdown from "../components/teams/TeamInvitesDropdown";
import { TeamMemberList } from "../components/teams/MembersList";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { ProjectsList } from "../components/projects/ProjectsList";

export const Projects = () => {
    const [teams, setTeams] = useState([]);
    const { user, profile, loading } = useAuth();
    const [dataLoading, setDataLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showInviteModalTeam, setShowCreateProjectModalTeam] = useState(null);

    function capitalizeFirstLetter(string) {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


    const fetchData = async () => {
        if (!user?.id) return [];

        try {
            // 0️⃣ Get team IDs for current user
            const { data: teamMemberships, error: teamMembershipsError } =
                await supabase
                    .from("team_members")
                    .select("team_id")
                    .eq("user_id", user.id);

            if (teamMembershipsError) throw teamMembershipsError;

            const teamIds = teamMemberships.map(t => t.team_id);
            if (!teamIds.length) return [];

            // 1️⃣ Fetch teams
            const { data: teamsData, error: teamsError } = await supabase
                .from("teams")
                .select("id, name, description")
                .in("id", teamIds);

            if (teamsError) throw teamsError;

            // 2️⃣ Fetch projects for these teams
            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("id, name, description, team_id, created_by")
                .in("team_id", teamIds);

            if (projectsError) throw projectsError;

            const projectCreatorIds = [...new Set(projectsData.map(p => p.created_by))];

            // 3️⃣ Fetch profiles for project creators
            const { data: profilesData, error: profilesError } =
                await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", projectCreatorIds);

            if (profilesError) throw profilesError;

            const profileMap = Object.fromEntries(
                profilesData.map(p => [p.id, p])
            );

            // 4️⃣ Fetch issues per project
            const projectIds = projectsData.map(p => p.id);
            const { data: issuesData, error: issuesError } = await supabase
                .from("issues")
                .select("*")
                .in("project_id", projectIds);

            if (issuesError) throw issuesError;

            const issuesByProject = {};
            issuesData.forEach(issue => {
                if (!issuesByProject[issue.project_id]) issuesByProject[issue.project_id] = [];
                issuesByProject[issue.project_id].push(issue);
            });

            // 5️⃣ Build projects array with creator and issues
            const projectsByTeam = {};
            projectsData.forEach(project => {
                if (!projectsByTeam[project.team_id]) projectsByTeam[project.team_id] = [];
                projectsByTeam[project.team_id].push({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    created_by: profileMap[project.created_by] || null,
                    issues: issuesByProject[project.id] || []
                });
            });

            // 6️⃣ Fetch team members
            const { data: membersData, error: membersError } = await supabase
                .from("team_members")
                .select("team_id, user_id, role")
                .in("team_id", teamIds);

            if (membersError) throw membersError;

            // Capture CURRENT USER role per team
            const myRoleByTeam = {};
            membersData.forEach(m => {
                if (m.user_id === user.id) {
                    myRoleByTeam[m.team_id] = m.role;
                }
            });

            const userIds = [...new Set(membersData.map(m => m.user_id))];

            // 7️⃣ Fetch profiles for members
            const { data: memberProfiles, error: memberProfilesError } =
                await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", userIds);

            if (memberProfilesError) throw memberProfilesError;

            const memberProfileMap = Object.fromEntries(
                memberProfiles.map(p => [p.id, p])
            );

            // 9️⃣ Build final teams array
            const teams = teamsData.map(team => ({
                id: team.id,
                name: team.name,
                description: team.description,
                role: myRoleByTeam[team.id] || "member",
                projects: projectsByTeam[team.id] || [],
                members: membersData
                    .filter(m => m.team_id === team.id)
                    .map(m => {
                        const profile = memberProfileMap[m.user_id];
                        return {
                            id: m.user_id,
                            role: m.role,
                            username: profile?.username,
                            email: profile?.email,
                            avatar_url: profile?.avatar_url,
                            issue_amount: issuesData.filter(issue => issue.created_by === m.user_id || issue.assigned_to === m.user_id).length
                        };
                    })
            }));

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
            console.log(data)
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
                            <h1 className="text-2xl font-bold text-white">Projects</h1>
                            <p className="text-gray-400">
                                View your teams projects.
                            </p>
                        </div>
                    </div>

                    
                </div>

                {/* Teams */}
                <div className="space-y-8">
                    {teams.map((team, teamIndex) => (
                        <div key={team.id} className="flex flex-col gap-3">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: teamIndex * 0.1}} 

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
                                            onClick={() => setShowCreateProjectModalTeam(team.id)} 
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2"
                                        >
                                            <lucide.LuPlus className="h-4 w-4" />
                                            Create Project
                                        </button>

                                        <CreateProjectModal 
                                            open={showInviteModalTeam === team.id}
                                            onClose={() => setShowCreateProjectModalTeam(null)}
                                            onCreate={updateData}
                                            user={user}
                                            teamId={team.id}
                                            teamName={team.name}
                                        />
                                    </>
                                )}
                            </motion.div>

                            <ProjectsList userRole={team.role} projects={team.projects} capitalizeFirstLetter={capitalizeFirstLetter} />
                            
                           
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
