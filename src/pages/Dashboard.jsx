import { motion } from "framer-motion";
import { supabase } from "../supabase-client";
import { DashboardQuickStats } from "../components/dashboard/DashboardQuickStats";
import { useAuth } from "../context/AuthContext";
import { DashboardToolbar } from "../components/dashboard/DashboardToolbar";
import { useState, useEffect } from "react";
import { FilterTabs } from "../components/dashboard/FilterStats";
import { IssueCard } from "../components/IssueCard";
import { LuPlus } from "react-icons/lu";

export function Dashboard() {
    const { user, loading } = useAuth();

    const [issuesSearch, setIssuesSearch] = useState('');
    const [stats, setStats] = useState({ teams: [], projects: [], openIssues: [], completedIssues: [] });
    const [loadingStats, setLoadingStats] = useState(true);
    const [issueLabels, setIssueLabels] = useState([]);
    const [activeLabelId, setActiveLabelId] = useState('');
    const [issues, setIssues] = useState([]);

    // Fetch stats
    const fetchStatsData = async (userId) => {
        try {
            const { data: userTeams, error: userTeamsError } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', userId);
            if (userTeamsError) throw new Error(userTeamsError.message);

            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('user_id', userId);
            if (userProjectsError) throw new Error(userProjectsError.message);

            const { data: userIssues, error: userIssuesError } = await supabase
                .from('issues')
                .select('id, is_active, created_at, project_id, title, description, type, priority, assigned_to, created_by')
                .or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
            if (userIssuesError) throw new Error(userIssuesError.message);

            const localStats = {
                teams: userTeams || [],
                projects: userProjects || [],
                openIssues: userIssues.filter(i => i.is_active),
                completedIssues: userIssues.filter(i => !i.is_active),
            };

            setStats(localStats);
            setLoadingStats(false);
            return localStats;
        } catch (e) {
            console.error('Error fetching stats:', e);
            setLoadingStats(false);
        }
    };

    // Fetch labels for all user projects
    const fetchProjectLabels = async (projects) => {
        try {
            const projectIds = projects.map(p => p.project_id);
            const { data: allLabels, error } = await supabase
                .from('labels')
                .select('id, name, color')
                .in('project_id', projectIds);

            if (error) throw new Error(error.message);
            return allLabels || [];
        } catch (e) {
            console.error('Error fetching labels:', e);
            return [];
        }
    };

    // Fetch issues across projects with optional label & search filters
    const fetchAllProjectIssues = async (projects, labelId = null, searchTitle = '') => {
        try {
            const projectIds = projects.map(p => p.project_id);

            const labelJoin = labelId ? 'issue_labels!inner' : 'issue_labels';

            let query = supabase
                .from('issues')
                .select(`
                    *,
                    ${labelJoin} (
                        labels (
                            id,
                            name,
                            color
                        )
                    ),
                    assignee:profiles!issues_assigned_to_fkey1 (
                        id,
                        username,
                        avatar_url
                    )
                `)
                .in('project_id', projectIds);

            if (labelId) query = query.eq('issue_labels.label_id', labelId);
            if (searchTitle?.trim()) query = query.ilike('title', `%${searchTitle.trim()}%`);

            const { data, error } = await query;
            if (error) throw error;

            // Normalize labels
            const normalizedIssues = data.map(issue => ({
                ...issue,
                labels: issue.issue_labels?.map(il => il.labels) || [],
            }));

            return normalizedIssues;
        } catch (e) {
            console.error('Failed to fetch issues:', e);
            return [];
        }
    };

    // Load initial data
    useEffect(() => {
        if (!user?.id || loading) return;

        const loadData = async () => {
            const fetchedStats = await fetchStatsData(user.id);
            if (fetchedStats?.projects) {
                const labels = await fetchProjectLabels(fetchedStats.projects);
                setIssueLabels(labels);
                if (labels.length > 0) setActiveLabelId(labels[0].id);

                const allIssues = await fetchAllProjectIssues(fetchedStats.projects);
                setIssues(allIssues);
            }
        };

        loadData();
    }, [user?.id, loading]);

    // Update issues when filters or search change
    useEffect(() => {
        const updateIssues = async () => {
            if (!stats.projects?.length) return;
            const filteredIssues = await fetchAllProjectIssues(
                stats.projects,
                activeLabelId || null,
                issuesSearch
            );
            setIssues(filteredIssues);
        };

        updateIssues();
    }, [activeLabelId, issuesSearch, stats.projects]);

    return (
        <div className="max-w-6xl mx-auto p-8 text-white">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400">Track and manage your project issues</p>
            </motion.div>

            <div className="mb-8">
                <DashboardQuickStats loading={loadingStats} stats={stats} />
            </div>

            <DashboardToolbar searchQuery={issuesSearch} setSearchQuery={setIssuesSearch} />

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6 overflow-x-auto">
                <FilterTabs
                    onFilterChange={setActiveLabelId}
                    activeFilter={activeLabelId}
                    filters={issueLabels}
                />
            </motion.div>

            <div className="space-y-3">
                {issues.length > 0 ? (
                    issues.map((issue, index) => <IssueCard key={issue.id} issue={issue} index={index} />)
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 flex justify-center items-center flex-col">
                        <p className="text-gray-400">No issues found</p>
                        <button
                            className="mt-4 text-sm flex justify-between cursor-pointer items-center gap-2 border-slate-700/80 border px-4 py-2 rounded-lg"
                            onClick={() => {}}
                        >
                            <LuPlus className="h-4 w-4 mr-2" />
                            Create your first issue
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
