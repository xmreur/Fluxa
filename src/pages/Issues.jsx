import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import * as lucide from 'react-icons/lu'
import { Tabs } from "../components/Tabs"
import { supabase } from "../supabase-client"
import { useAuth } from "../context/AuthContext"
import { IssueCard } from "../components/IssueCard"

export const Issues = () => {

    const { user, profile, loading } = useAuth()

    const [assigned, setAssigned] = useState([])
    const [created, setCreated] = useState([])
    const [activeTab, setActiveTab] = useState('assigned')
    const [loadingIssues, setLoadingIssues] = useState(true)

    const tabs = [
        { value: 'assigned', name: 'Assigned', icon: lucide.LuInbox },
        { value: 'created', name: 'Created', icon: lucide.LuCircleCheck }
    ]

    // Fetch issues assigned to or created by the current user
    const fetchIssues = async () => {
        if (!user?.id) return
        setLoadingIssues(true)

        try {
            const { data, error } = await supabase
                .from('issues')
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
                .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) throw error

            // normalize labels from join table
            const normalized = data.map(issue => ({
                ...issue,
                labels: issue.issue_labels?.map(il => il.labels) || []
            }))

            // Split assigned vs created
            setAssigned(normalized.filter(issue => issue.assigned_to === user.id && issue.is_active))
            setCreated(normalized.filter(issue => issue.created_by === user.id))
        } catch (err) {
            console.error('Failed to fetch issues:', err)
        } finally {
            setLoadingIssues(false)
        }
    }

    useEffect(() => {
        if (!loading) fetchIssues()
    }, [user, loading])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-full mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl text-white font-bold flex items-center gap-3">
                        <lucide.LuFileText className="h-8 w-8 text-blue-500" />
                        My Issues
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Track issues assigned to you and ones you created
                    </p>
                </div>
            </div>

            <Tabs 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
                counts={{ assigned: assigned.length, created: created.length }}
            />

            {/* Issues List */}
            <div className="mt-6 min-w-full min-h-fit space-y-4">
                {loadingIssues ? (
                    <div className="flex justify-center py-10">
                        <lucide.LuLoaderCircle className="h-10 w-10 animate-spin text-white" />
                    </div>
                ) : (
                    <>
                        <div className={`${activeTab === 'assigned' ? 'block' : 'hidden'} space-y-3`}>
                            {assigned.length > 0 ? (
                                assigned.map((issue, index) => (
                                    <IssueCard key={issue.id} issue={issue} index={index} />
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-8">No assigned issues</p>
                            )}
                        </div>

                        <div className={`${activeTab === 'created' ? 'block' : 'hidden'} space-y-3`}>
                            {created.length > 0 ? (
                                created.map((issue, index) => (
                                    <IssueCard key={issue.id} issue={issue} index={index} />
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-8">No created issues</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    )
}
