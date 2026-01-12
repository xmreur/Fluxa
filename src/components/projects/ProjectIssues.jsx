import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import * as lucide from "react-icons/lu";
import { Card, CardContent } from "../Card";
import { IssueCard } from "../IssueCard";

export const ProjectIssues = ({
    projectId,
    setIssuesAmount,
    setShowCreateIssueModal,
    refresh
}) => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);


    const loadIssues = async () => {
        if (!projectId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from("issues")
            .select(`
                *,
                issue_labels (
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
                ),
                creator:profiles!issues_created_by_fkey (
                    id,
                    username,
                    email,
                    avatar_url
                )
            `)
            .eq("project_id", projectId)
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to load issues:", error);
            setLoading(false);
            return;
        }

        const normalizedIssues = data.map(issue => ({
            ...issue,
            labels: issue.issue_labels?.map(il => il.labels) || [],
        }));

        setIssues(normalizedIssues);
        setIssuesAmount(normalizedIssues.length);
        setLoading(false);
    };

    useEffect(() => {
        if (refresh) refresh.current = loadIssues;
    }, [refresh, projectId]);

    useEffect(() => {
        loadIssues();
    }, [projectId]);

    if (loading) {
        return (
            <div className="w-full py-10 flex justify-center">
                <lucide.LuLoaderCircle className="h-10 w-10 animate-spin text-white" />
            </div>
        );
    }

    if (issues.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                    <lucide.LuFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium mb-1">No issues yet</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Create the first issue to get started
                    </p>
                    <button
                        onClick={() => setShowCreateIssueModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                    >
                        Create Issue
                    </button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {console.log(issues)}
            {issues.map((issue, index) => (

                <IssueCard key={issue.id} issue={issue} index={index} />
            ))}
        </div>
    );
};
