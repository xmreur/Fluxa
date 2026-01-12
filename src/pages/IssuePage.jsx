import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { IoIosMore } from "react-icons/io";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Avatar } from "../components/Avatar";
import { supabase } from "../supabase-client";
import { DropdownMenu } from "../components/DropdownMenu";
import { DeleteIssueModal } from "../components/modals/DeleteIssueModal";
import { TypeIndicator } from "../components/TypeIndicator";
import { Label } from "../components/Label";
import { formatDate, formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { Select } from "../components/Select";
import { PriorityIndicator } from "../components/PriorityIndicator";
import { EditIssueModal } from "../components/modals/EditIssueModal";


export const IssuePage = () => {
    const { issueId } = useParams();

    const navigate = useNavigate()

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [hasVoted, setHasVoted] = useState(false);

    const { user, profile } = useAuth();

    const [loading, setLoading] = useState(true);

    const [issue, setIssue] = useState(null);
    const [members, setMembers] = useState([]);

    const [showEditModal, setShowEditModal] = useState(false);

    const getStatusIcon = (status) => {

        switch (status) {
            case "todo":
                return lucide.LuCircle;
            case "in-progress":
                return lucide.LuClock2;
            case "done":
                return lucide.LuCircleCheck;
            case "cancelled":
                return lucide.LuCircleX;
            default:
                return lucide.LuCircleHelp;
        }
    };


    const priorityMap = {
        5: "Critical",
        4: 'High',
        3: 'Medium',
        2: 'Low',
        1: 'Very Low'
    }

    const loadIssue = async () => {
        if (!issueId) return;
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
                email,
                avatar_url
            ),
            creator:profiles!issues_created_by_fkey (
                id,
                username,
                email,
                avatar_url
            ),
            project:projects (
                id,
                name
            ),
            votes (
                user_id
            ),
            issue_comments (
                id,
                author_id,
                author:profiles (
                    id,
                    username,
                    avatar_url
                ),
                content,
                created_at,
                edited_at
            )
        `)
            .eq("id", issueId)
            .maybeSingle();

        if (error) {
            console.error("Failed to load issue:", error);
            setLoading(false);
            return;
        }

        const normalizedIssue = {
            ...data,
            labels: data.issue_labels?.map(il => il.labels) || [],
        };

        // ✅ Set votes state for current user
        const userHasVoted = normalizedIssue.votes.some(v => v.user_id === user.id);

        setIssue(normalizedIssue);
        setHasVoted(userHasVoted); // ← set here
        setLoading(false);
    };



    useEffect(() => {
        loadIssue()
    }, [issueId]);

    const loadMembers = async () => {

        const { data: _membersIds } = await supabase.from('project_members').select('user_id').eq('project_id', issue.project_id)

        const memberIds = _membersIds.map(member => member.user_id);

        const { data: profiles } = await supabase.from('profiles').select('id, username, email, avatar_url').in('id', memberIds)

        setMembers(profiles);
    }

    useEffect(() => {
        if (issue?.project?.id) {
            loadMembers();
        }
    }, [issue]);

    const handleVote = async () => {

        if (hasVoted) {
            await supabase.from('votes').delete().eq('issue_id', issue.id).eq('user_id', user.id)
            setIssue(prev => ({
                ...prev,
                votes: prev.votes.filter(v => v.user_id !== user.id),
            }));
        }
        else {
            await supabase.from('votes').insert({ issue_id: issue.id, user_id: user.id })

            setIssue(prev => ({
                ...prev,
                votes: [...prev.votes, { user_id: user.id }],
            }));
        }

        setHasVoted(!hasVoted)
    }

    const handleNewComment = async () => {

        await supabase.from('issue_comments').insert({ issue_id: issue.id, author_id: user.id, content: newComment })

        await loadIssue();
        setNewComment('')
    }

    const handleStatusChange = async (newStatus) => {
        if (!issue) return;

        const { data, error } = await supabase
            .from('issues')
            .update({ status: newStatus })
            .eq('id', issueId)
            .select('*')
            .maybeSingle();

        if (error) {
            console.error('Failed to update status:', error);
            return;
        }

        setIssue(prev => ({
            ...prev,
            status: data.status,
        }));
    }

    const handlePriorityChange = async (newPriority) => {
        if (!issue) return;

        const numericPriority = Number(newPriority);

        const { data, error } = await supabase
            .from('issues')
            .update({ priority: numericPriority })
            .eq('id', issue.id)
            .select('*')
            .maybeSingle();

        if (error) {
            console.error('Failed to update priority:', error);
            return;
        }

        if (!data) {
            console.warn('No issue found with ID:', issue.id);
            return; // stop, prevent TypeError
        }
        setIssue(prev => ({
            ...prev,
            priority: numericPriority,
        }));
    }


    const handleAssigneeChange = async (newAssigneeId) => {
        if (!issue) return;

        // Update the issue in Supabase
        const { data, error } = await supabase
            .from('issues')
            .update({ assigned_to: newAssigneeId })
            .eq('id', issue.id)
            .select('*, assignee:profiles!issues_assigned_to_fkey1 (id, username, avatar_url)') // get updated assignee profile
            .maybeSingle();

        if (error) {
            console.error('Failed to update assignee:', error);
            return;
        }

        // Update local state with new assignee
        setIssue(prev => ({
            ...prev,
            assignee: data.assignee,
            assigned_to: data.assigned_to,
        }));
    };


    const assigneeItems = useMemo(() => {
        return members.map(member => ({
            value: member.id,
            label: member.username,
            icon: () => <Avatar profile={member} className="h-4 w-4" />,
        }));
    }, [members]); // only recalculated when members change


    if (!issue) {
        return (
            <div className="flex p-8 flex-1 items-center justify-center">
                <div className="text-center flex justify-center flex-col items-center gap-5">
                    <h1 className="text-4xl font-bold mb-2 text-white">Issue not found</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex justify-center items-center border border-white px-4 py-2 rounded-lg cursor-pointer text-white group"
                    >
                        <lucide.LuArrowLeft className="h-6 w-6 mr-2" />
                        Go back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto flex flex-col items-center"
        >
            <div className="flex items-center gap-4 mb-6 w-full">
                <button
                    onClick={() => navigate(-1)}
                    className="flex justify-center items-center hover:bg-slate-700/75  px-2 py-2 rounded-lg cursor-pointer text-white group"
                >
                    <lucide.LuArrowLeft className=" duration-100 h-6 w-6" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <span
                            className="hover:underline cursor-pointer"
                            onClick={() => navigate(`/projects/${issue.project.id}`)}
                        >
                            {issue.project.name}
                        </span>
                        <span>/</span>
                        <span>FLX-#{issue.id.slice(-12)}</span>
                    </div>
                </div>

                <DropdownMenu
                    trigger={
                        <button

                            className="flex justify-center items-center border border-slate-700 hover:bg-slate-700 px-2 py-2 rounded-lg cursor-pointer text-white group"
                        >
                            <IoIosMore className="h-4 w-4 mr-" />
                        </button>
                    }

                    items={[
                        { label: 'Edit Issue', icon: lucide.LuPencil, onClick: () => setShowEditModal(true) },
                        { label: 'Delete Issue', icon: lucide.LuTrash2, className: 'text-red-500 hover:text-red-500', onClick: () => setIsDeleteDialogOpen(true) },
                    ]}
                />
                <DeleteIssueModal
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 w-full">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <TypeIndicator type={issue.type} />
                                <h1 className="text-xl font-bold flex-1">{issue.title}</h1>
                            </div>
                            <p className="text-gray-400 whitespace-pre-wrap">{issue.description}</p>

                            {issue.labels && issue.labels.length > 0 && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <lucide.LuTag className="h-4 w-4 text-gray-400" />
                                    <div className="flex flex-wrap gap-1">
                                        {issue.labels.map(label => (
                                            <Label key={label.id} label={label} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleVote()}
                            className={`flex gap-2 justify-center items-center border border-slate-700 hover:bg-slate-700 px-2 py-2 outline-none rounded-lg cursor-pointer text-white group ${hasVoted ? 'bg-blue-500 hover:bg-blue-600! text-black' : ''}`}
                        >
                            <lucide.LuThumbsUp className="h-4 w-4" />
                            {(issue.votes.length || 0)}
                        </button>
                        <span className="text-sm text-gray-400">
                            {issue.issue_comments.length} comments
                        </span>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <lucide.LuMessageSquare className="h-5 w-5" />
                                Comments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {issue.issue_comments.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    No comments yet. Be the first to comment!
                                </p>
                            ) : (
                                issue.issue_comments.map((comment, index) => (
                                    <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex gap-3"
                                    >
                                        <Avatar className='h-8 w-8 shrink-0' profile={comment.author} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{comment.author?.username || 'Deleted account'}</span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDistanceToNow(comment.created_at, { addSuffix: true })}
                                                    {comment.updated_at && (
                                                        <span className="font-bold">Edited {formatDistanceToNow(comment.updated_at, { addSuffix: true })}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-sm">{comment.content}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            <div className="mb-4 border-b border-slate-700" />

                            <div className="flex gap-3">
                                <Avatar profile={profile} className="h-8 w-8 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <textarea
                                        name="comment"
                                        id="comment"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full p-3 h-auto max-h-80 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleNewComment()}
                                            className="flex items-center text-black justify-center gap-1 px-4 py-2 bg-blue-500 disabled:bg-blue-500/40 rounded-lg transition-all"
                                            disabled={!newComment.trim()}
                                        >
                                            <lucide.LuSend className="h-4 w-4 mr-2" />
                                            Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <label htmlFor="status" className="text-xs text-gray-400 mb-2 block">Status</label>

                            {[issue.assigned_to, issue.created_by].includes(user.id) ? (
                                <Select
                                    className="text-white w-fit!"
                                    value={issue.status}
                                    onValueChange={handleStatusChange}
                                    items={[
                                        { value: 'todo', label: 'Todo', icon: getStatusIcon(issue.status) },
                                        { value: 'in-progress', label: 'In Progress', icon: getStatusIcon(issue.status) },
                                        { value: 'done', label: 'Done', icon: getStatusIcon(issue.status) },
                                        { value: 'cancelled', label: 'Cancelled', icon: getStatusIcon(issue.status) },
                                    ]}
                                />
                            ) : (
                                <>
                                    <PriorityIndicator priority={getStatusIcon(issue.status)} />
                                    <span className="capitalize">{issue.status}</span>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <label htmlFor="priority" className="text-xs text-gray-400 mb-2 block">Priority</label>
                            <div className="flex items-center gap-2">
                                {[issue.assigned_to, issue.created_by].includes(user.id) ? (
                                    <Select
                                        value={issue.priority}
                                        onValueChange={handlePriorityChange}  // ← Add this
                                        className="text-white w-full"
                                        items={[
                                            { value: 5, label: 'Critical', icon: () => <PriorityIndicator priority={5} /> },
                                            { value: 4, label: 'High', icon: () => <PriorityIndicator priority={4} /> },
                                            { value: 3, label: 'Medium', icon: () => <PriorityIndicator priority={3} /> },
                                            { value: 2, label: 'Low', icon: () => <PriorityIndicator priority={2} /> },
                                            { value: 1, label: 'Very Low', icon: () => <PriorityIndicator priority={1} /> },
                                        ]}
                                    />
                                ) : (
                                    <>
                                        <PriorityIndicator priority={issue.priority} />
                                        <span className="capitalize">{priorityMap[issue.priority]}</span>
                                    </>
                                )}

                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <label className="text-xs text-gray-400 mb-2 block">Assignee</label>

                            {issue.assignee && (issue.created_by === user.id ? (
                                <Select
                                    value={issue.assigned_to}
                                    onValueChange={handleAssigneeChange}
                                    className="text-gray-400"
                                    items={assigneeItems}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Avatar profile={issue.assignee} className="h-6 w-6" />
                                    <span className="text-sm">{issue.assignee?.username || 'Deleted account'}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>


                    <Card>
                        <CardContent className="p-4">
                            <label htmlFor="priority" className="text-xs text-gray-400 mb-2 block">Reporter</label>
                            <div className="flex items-center gap-2">
                                <Avatar profile={issue.creator} className="h-6 w-6" />
                                <span className="text-sm">{issue.creator?.username || 'Deleted account'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Created</label>
                                <div className="flex items-center gap-2 text-sm">
                                    <lucide.LuCalendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDate(issue.created_at, 'MMM d, yyyy - HH:mm')}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Updated</label>
                                <div className="flex items-center gap-2 text-sm capitalize">
                                    <lucide.LuClock className="h-4 w-4 text-muted-foreground" />
                                    {formatDistanceToNow(issue.updated_at, { addSuffix: true })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <EditIssueModal
                onUpdate={loadIssue}
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={user}
                issue={issue}
            />

        </motion.div>
    )
}