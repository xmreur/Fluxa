import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "../Card"
import * as lucide from "react-icons/lu"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "../../supabase-client"
import { PriorityIndicator } from "../PriorityIndicator"
import { TypeIndicator } from "../TypeIndicator"

export const ProjectIssues = ({
    projectId,
    setIssuesAmount,
    userRole,
    showCreateIssueModal,
    refresh
}) => {
    const [issues, setIssues] = useState([])
    const [loading, setLoading] = useState(true)

    const navigate = useNavigate()

    const loadIssues = async () => {
        if (!projectId) return

        setLoading(true)

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
                assignee:profiles (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq("project_id", projectId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Failed to load issues:", error)
            setLoading(false)
            return
        }

        // normalize labels from join table
        const normalizedIssues = data.map(issue => ({
            ...issue,
            labels: issue.issue_labels?.map(il => il.labels) || [],
        }))

        setIssues(normalizedIssues)
        setIssuesAmount(normalizedIssues.length)
        setLoading(false)
    }

    useEffect(() => {
        if (refresh) refresh.current = loadIssues;
    }, [refresh, projectId])

    useEffect(() => {
        loadIssues()
    }, [projectId])

    const getStatusIcon = (status) => {
        switch (status) {
            case "todo":
                return <lucide.LuCircle className="h-4 w-4 text-gray-400" />
            case "in-progress":
                return <lucide.LuClock2 className="h-4 w-4 text-amber-500" />
            case "done":
                return <lucide.LuCircleCheck className="h-4 w-4 text-green-500" />
            case "cancelled":
                return <lucide.LuCircleX className="h-4 w-4 text-red-500" />
            default:
                return <lucide.LuCircleHelp className="h-4 w-4 text-purple-500" />
        }
    }

    if (loading) {
        return (
            <div className="w-full py-10 flex justify-center">
                <lucide.LuLoaderCircle className="h-10 w-10 animate-spin text-white" />
            </div>
        )
    }

    return (
        <>
            {issues.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <lucide.LuFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium mb-1">No issues yet</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Create the first issue to get started
                        </p>
                        <button
                            onClick={() => showCreateIssueModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                        >
                            Create Issue
                        </button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {issues.map((issue, index) => (
                        <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <Card
                                className="hover:bg-blue-500/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/issues/${issue.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* LEFT */}
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            {getStatusIcon(issue.status)}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium truncate">
                                                        {issue.title}
                                                    </span>
                                                    <TypeIndicator type={issue.type} />
                                                </div>

                                                <p className="text-sm text-gray-400 line-clamp-1">
                                                    {issue.description}
                                                </p>

                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                    <span>FLX-{issue.id.slice(-12)}</span>
                                                    <span>·</span>
                                                    <span>
                                                        {formatDistanceToNow(
                                                            new Date(issue.created_at),
                                                            { addSuffix: true }
                                                        )}
                                                    </span>

                                                    {issue.labels.length > 0 && (
                                                        <>
                                                            <span>·</span>
                                                            <div className="flex items-center gap-1">
                                                                {issue.labels.slice(0, 2).map(label => (
                                                                    <span
                                                                        key={label.id}
                                                                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                                                        style={{
                                                                            backgroundColor: `${label.color}20`,
                                                                            color: label.color,
                                                                        }}
                                                                    >
                                                                        {label.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            { <PriorityIndicator priority={issue.priority} /> }

                                            {issue.assignee && (
                                                issue.assignee.avatar_url ? (
                                                    <img
                                                        src={issue.assignee.avatar_url}
                                                        alt={issue.assignee.username}
                                                        className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                                                    />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                                        {issue.assignee.username?.[0]?.toUpperCase()}
                                                    </div>
                                                    
                                                )
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </>
    )
}
