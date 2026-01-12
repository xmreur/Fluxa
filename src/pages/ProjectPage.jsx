import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router"
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import * as lucide from 'react-icons/lu'
import { motion } from "framer-motion";
import { Card, CardContent } from "../components/Card";
import { Tabs } from "../components/Tabs";
import { LabelsTab } from "../components/projects/Labels";
import { ProjectMembers } from "../components/projects/ProjectMembers";
import { CreateIssueModal } from "../components/modals/CreateIssueModal";
import { ProjectIssues } from "../components/projects/ProjectIssues";
import { EditProjectModal } from "../components/modals/EditProjectModal";

export const ProjectPage = () => {

    const params = useParams();
    const projectId = params.projectId;

    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();

    const [canView, setCanView] = useState(true);
    const [ensured, setEnsured] = useState(false);

    const [project, setProject] = useState({})
    const [issues, setIssues] = useState([])

    const [labelAmount, setLabelAmount] = useState(0);
    const [membersAmount, setMembersAmount] = useState(0);
    const [issuesAmount, setIssuesAmount] = useState(0);

    const [userRole, setUserRole] = useState('member');

    const [activeTab, setActiveTab] = useState('issues');


    const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false)

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [projectInvites, setProjectInvites] = useState([]);


    const bugAmount = (issues) => {
        return issues.filter((issue) => issue.type == 'bug').length
    }

    const activeAmount = (issues) => {
        return issues.filter((issue) => issue.is_active == true).length
    }

    const solvedIssues = (issues) => {
        return issues.filter((issue) => issue.is_active == false).length
    }

    const refreshIssuesRef = useRef(null)

    const [reloadTabs, setReloadTabs] = useState(false);

    const fetchData = async () => {


        const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('id', projectId).single()
        const { data: issuesData, error: issuesError } = await supabase.from('issues').select('*').eq('project_id', projectId)

        setProject(projectData)
        setIssues(issuesData)
        setIssuesAmount(issuesData.length)
        const { count: labelsData } = await supabase.from('labels').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
        const { count: membersData } = await supabase.from('project_members').select('user_id', { count: 'exact', head: true }).eq('project_id', projectId);

        setLabelAmount(labelsData)
        setMembersAmount(membersData)
        setReloadTabs(true)
    }

    const handleIssueCreated = () => {
        refreshIssuesRef.current?.();
        fetchData();
    }

    useEffect(() => {
        const init = async () => {
            // 1️⃣ Check if user is in the project
            const { data: inProject, error: projectError } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .maybeSingle(); // returns null if not found

            if (!inProject || projectError) {
                setCanView(false);
                setEnsured(true)
                return; // stop further execution
            }

            setCanView(true);

            // 2️⃣ Fetch user role
            const { data: roleData, error: roleError } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .single();

            if (!roleError) {
                setUserRole(roleData.role);
            }

            setEnsured(true)
            // 3️⃣ Fetch project members (your existing function)
            await fetchData();
        };

        init(); // call the async function
        setReloadTabs(false)
    }, [projectId, user.id]); // dependencies


    const tabs = [
        { value: 'issues', name: 'Issues', icon: lucide.LuFileText },
        { value: 'members', name: 'Members', icon: lucide.LuUsers },
        { value: 'labels', name: 'Labels', icon: lucide.LuTag }
    ]

    if (!ensured) {
        return <div className="flex min-h-full w-full justify-center items-center">
            <lucide.LuLoaderCircle className="h-12 w-12 animate-spin text-white" />
        </div>
    }

    if (!canView) {
        return (
            <div className="flex p-8 flex-1 items-center justify-center">
                <div className="text-center flex justify-center flex-col items-center gap-5">
                    <h1 className="text-4xl font-bold mb-2 text-white">Project not found</h1>
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex justify-center items-center border border-white px-4 py-2 hover:scale-105 transition-all rounded-lg cursor-pointer hover:gap-2 text-white group"
                    >
                        <lucide.LuArrowLeft className="transition-all duration-100 h-6 w-6 mr-2" />
                        Back to Projects
                    </button>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-full min-h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/projects')}
                        className="bg-transparent outline-none px-3 py-3 hover:bg-gray-500/50 transition-all rounded-lg cursor-pointer"
                    >
                        <lucide.LuArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-pink-500/50 flex items-center justify-center">
                        <lucide.LuFolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-white">
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <p className="text-gray-400">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex justify-center items-center border border-white px-4 py-2 hover:bg-gray-500/20  transition-all rounded-lg cursor-pointer text-white group"
                    >
                        <lucide.LuSettings className="h-4 w-4 mr-2" />
                        Settings
                    </button>
                    <button
                        onClick={() => setShowCreateIssueModal(true)}
                        className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2"
                    >
                        <lucide.LuPlus className="h-4 w-4" />
                        New Issue
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="py-4">
                    <CardContent >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Total Issues</p>
                                <p className="text-2xl font-bold">{issuesAmount}</p>
                            </div>
                            <lucide.LuFileText className="h-8 w-8 text-gray-400/60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-4">
                    <CardContent >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Open Bugs</p>
                                <p className="text-2xl font-bold text-red-500">{bugAmount(issues)}</p>
                            </div>
                            <lucide.LuBug className="h-8 w-8 text-red-500/60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-4">
                    <CardContent >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Active Issues</p>
                                <p className="text-2xl font-bold text-amber-500">{activeAmount(issues)}</p>
                            </div>
                            <lucide.LuClock className="h-8 w-8 text-amber-500/60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-4">
                    <CardContent className="-mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Completed</p>
                                <p className="text-2xl font-bold text-green-500">{solvedIssues(issues)}</p>
                            </div>
                            <lucide.LuCircleCheck className="h-8 w-8 text-green-500/60" />
                        </div>
                    </CardContent>
                    <div className="px-5">
                        <progress
                            className="h-1.5 mt-2 w-full appearance-none rounded-full overflow-hidden
                                bg-slate-700
                                [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-bar]:rounded-full
                                [&::-webkit-progress-value]:bg-blue-500 [&::-webkit-progress-value]:rounded-full
                                [&::-moz-progress-bar]:bg-blue-500
                                block"
                            value={issuesAmount > 0 ? Math.min(100, (solvedIssues(issues) / issuesAmount) * 100) : 0}
                            max={issuesAmount}
                        />
                    </div>
                </Card>
            </div>

            <Tabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
                counts={{ issues: issuesAmount, members: membersAmount, labels: labelAmount }}
            />

            <div className="mt-6 min-w-full min-h-fit">
                <div className={activeTab === 'issues' ? 'block' : 'hidden'}>
                    <ProjectIssues
                        userRole={userRole}
                        projectId={projectId}
                        setIssuesAmount={setIssuesAmount}
                        setShowCreateIssueModal={setShowCreateIssueModal}
                        refresh={refreshIssuesRef}
                    />
                </div>

                <div className={activeTab === 'members' ? 'block' : 'hidden'}>
                    <ProjectMembers
                        userRole={userRole}
                        projectId={projectId}
                        projectName={project.name}
                        setMembersAmount={setMembersAmount}
                        toUpdate={reloadTabs}
                    />
                </div>

                <div className={activeTab === 'labels' ? 'block' : 'hidden'}>
                    <LabelsTab
                        projectId={project.id}
                        setLabelAmount={setLabelAmount}
                    />
                </div>
            </div>

            <CreateIssueModal
                open={showCreateIssueModal}
                onClose={() => setShowCreateIssueModal(false)}
                onCreate={handleIssueCreated}
                projectId={project.id}
                projectName={project.name}
                user={user}
            />

            {userRole !== 'member' && (

                <EditProjectModal
                    open={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onCreate={fetchData}
                    projectName={project.name}
                    userRole={userRole}
                    projectDescription={project.description}
                    projectId={project.id}
                />
            )}


        </motion.div>
    )
}