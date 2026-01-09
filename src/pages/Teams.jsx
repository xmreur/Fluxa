import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../components/Card";

export const Teams = () => {

    const [teams, setTeams] = useState([])

    const { user, profile, loading } = useAuth()

    const fetchData = async () => {
        if (!user?.id) return {}
        try {
            // 0️⃣ Get team IDs for current user
            const { data: teamMemberships, error: teamMembershipsError } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id);

            if (teamMembershipsError) throw teamMembershipsError;

            const teamIds = teamMemberships.map(t => t.team_id);

            if (teamIds.length === 0) return {};
            // 1️⃣ Fetch teams
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('id, name')
                .in('id', teamIds);

            if (teamsError) throw teamsError;

            // 2️⃣ Fetch all team members
            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('team_id, user_id, role')
                .in('team_id', teamIds);

            if (membersError) throw membersError;

            const userIds = [...new Set(membersData.map(m => m.user_id))];

            // 3️⃣ Fetch all profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, email, avatar_url')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // 4️⃣ Fetch issue counts per user (ONE QUERY)
            const { data: issuesData, error: issuesError } = await supabase
                .from('issues')
                .select('created_by, assigned_to');

            if (issuesError) throw issuesError;

            // Count issues per user
            const issueCountByUser = {};

            issuesData.forEach(issue => {
                if (issue.created_by) {
                    issueCountByUser[issue.created_by] =
                        (issueCountByUser[issue.created_by] || 0) + 1;
                }
                if (issue.assigned_to) {
                    issueCountByUser[issue.assigned_to] =
                        (issueCountByUser[issue.assigned_to] || 0) + 1;
                }
            });

            // Index profiles by id
            const profileMap = Object.fromEntries(
                profilesData.map(p => [p.id, p])
            );

            // 5️⃣ Build final structure
            const teams = teamsData.map(team => ({
                id: team.id,
                name: team.name,
                members: []
            }));

            membersData.forEach(member => {
                const profile = profileMap[member.user_id];

                if (!profile) return;

                teams[member.team_id].members.push({
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
            console.error('Failed to fetch teams members data:', e);
            return {};
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setTeams(await fetchData(teamsIds))
        }


    }, [])

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/15">
                        <lucide.LuUsers className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Team</h1>
                        <p className="text-gray-400">
                            Manage your teams, members and roles.
                        </p>
                    </div>
                </div>
                <button
                    className="text-white bg-blue-500 hover:bg-blue-600 transition-colors rounded-lg flex justify-center items-center cursor-pointer px-5 py-2 "
                >
                    <lucide.LuPlus className="h-4 w-4 mr-2" />
                    Invite Member
                </button>
            </div>

            <div className="grid gap-4">
                {teams.map((team, index) => {
                    <motion.h2
                        key={team.id}
                        initial={{opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {team.name}
                    </motion.h2>

                    {team.members.map((member, index) => (
                        <motion.div 
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1}}
                        >
                            <Card className="hover:border-blue-500/50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {
                                            member.avatar_url ?
                                            <img className="w-8 h-8 text-white font-bold rounded-full bg-indigo-700 flex items-center justify-center" src={member.avatar_url} alt={member.username} />
                                            :
                                            <div className="w-8 h-8 text-white font-bold rounded-full bg-indigo-700 flex items-center justify-center">
                                                {member.username.charAt(0).toUpperCase()}
                                            </div>
                                        }
                                        <div>
                                            <p className="font-medium">{member.name}</p>
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
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                                member.role === 'Owner'
                                                ? 'bg-yellow-500/10 text-yellow-600'
                                                : member.role === 'Admin'
                                                ? 'bg-blue-500/15 text-white'
                                                : 'bg-gray-600 text-gray-400'
                                            }`}
                                        >
                                        {member.role === 'Owner' ? (
                                            <lucide.LuCrown className="h-3.5 w-3.5" />
                                        ) : member.role === 'Admin' ? (
                                            <lucide.LuShield className="h-3.5 w-3.5" />
                                        ) : (
                                            <lucide.LuUser className="h-3.5 w-3.5" />
                                        )}
                                        {member.role}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                })}
            </div>
        </motion.div>
    )
}