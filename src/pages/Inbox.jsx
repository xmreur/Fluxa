import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import * as lucide from 'react-icons/lu'
import { Tabs } from "../components/Tabs"
import { Card, CardContent } from "../components/Card"
import { supabase } from "../supabase-client"
import { DropdownMenu } from "../components/DropdownMenu"
import { useAuth } from "../context/AuthContext"

export const Inbox = () => {

    const { user, profile, loading } = useAuth()

    const [invites, setInvites] = useState([])
    const [notifications, setNotifications] = useState([])

    const [filter, setFilter] = useState('all') // 'all', 'unread'
    const [activeTab, setActiveTab] = useState('invites')

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ""


    const handleAcceptInvite = async (inviteId, inviteTeamId, inviteRole) => {
        await supabase.from('invites').delete().eq('id', inviteId)

        await supabase.from('team_members').insert({ team_id: inviteTeamId, user_id: user.id, role: inviteRole })
        setReloadData(true);
    }

    const handleDeclineInvite = async (inviteId) => {
        await supabase.from('invites').delete().eq('id', inviteId)
        setReloadData(true);
    }

    const handleMarkAsRead = async (notificationId) => {
        await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    }

    const handleMarkAllAsRead = async () => {
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    }

    const [teamNames, setTeamNames] = useState({}) // map team_id -> team name


    const [projectNames, setProjectNames] = useState({}) // map team_id -> team name


    const [reloadData, setReloadData] = useState(false);

    const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    const tabs = [
        { value: 'invites', name: 'Invites', icon: lucide.LuUsers },
        { value: 'notifications', name: 'Notifications', icon: lucide.LuMail, className: unreadCount > 0 ? 'bg-red-500' : '' }
    ]

    useEffect(() => {
        const loadTeamNames = async () => {
            const teamIds = invites.map(invite => invite.team_id)
            const { data, error } = await supabase
                .from('teams')
                .select('id, name')
                .in('id', teamIds)

            if (data) {
                // create a lookup table
                const namesMap = {}
                data.forEach(team => { namesMap[team.id] = team.name })
                setTeamNames(namesMap)
            }
        }

        const loadProjectNames = async () => {
            const projectIds = notifications.map(notification => notification.project_id)
            const { data, error } = await supabase
                .from('projects')
                .select('id,name').in('id', projectIds)

            if (data) {
                const namesMap = {}
                data.forEach(project => { namesMap[project.id] = project.name })
                setProjectNames(namesMap)
            }
        }

        loadTeamNames()
        loadProjectNames()
    }, [invites, notifications])

    useEffect(() => {
        if (!user) return

        const fetchInboxData = async () => {

            /* ----------- FETCH INVITES ----------- */
            const { data: invitesData, error: invitesError } = await supabase
                .from('invites')
                .select('*')
                .eq('invitee_email', user.email)
                .order('created_at', { ascending: false })

            if (!invitesError && invitesData) {
                setInvites(invitesData)
            }

            /* -------- FETCH NOTIFICATIONS -------- */
            const { data: notificationsData, error: notificationsError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (!notificationsError && notificationsData) {
                setNotifications(notificationsData)
            }
        }

        fetchInboxData()
        setReloadData(false)
    }, [user, reloadData === true])


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
                        <lucide.LuInbox className="h-8 w-8 text-blue-500" />
                        Inbox
                    </h1>
                    <p className="text-gray-400 mt-1">
                        View your invites and notifications
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 text-white gap-5 rounded-lg flex justify-center items-center bg-transparent border border-gray-400/30 hover:bg-gray-400/30 cursor-pointer"
                    >
                        <lucide.LuMailOpen className="h-4 w-4 text-white" />
                        Mark all as read
                    </button>
                )}
            </div>

            <Tabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
                counts={{ invites: invites.length, notifications: unreadCount }}
            />


            <div className="mt-6 min-w-full min-h-fit">

                <div className={`space-y-4 ${activeTab === 'invites' ? 'block' : 'hidden'}`}>
                    <div className="grid gap-3">
                        {invites.length === 0 && (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <lucide.LuUsers className="h-12 w-12 text-gray-400/50 mb-4" />
                                    <h3 className="text-lg font-medium">No pending invites</h3>
                                    <p className="text-gray-400 text-sm">
                                        You'll see team and project invites here
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {invites.map((invite, index) => (
                            <motion.div
                                key={invite.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:bg-slate-700/30 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <lucide.LuUsers className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">
                                                        Invitation to join {teamNames[invite.team_id]}
                                                    </h4>

                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <div className="flex justify-center items-center gap-1">
                                                            Will join as
                                                            <span className="font-bold text-gray-300">
                                                                {capitalize(invite.role)}
                                                            </span>
                                                        </div>
                                                        <span>•</span>
                                                        <lucide.LuClock className="h-3 w-3" />
                                                        <span className="text-sm text-gray-400">
                                                            {formatDistanceToNow(
                                                                new Date(invite.created_at),
                                                                { addSuffix: true }
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDeclineInvite(invite.id)}
                                                    className="px-4 py-2 text-white gap-2 rounded-lg flex justify-center items-center bg-transparent border border-gray-400/30 hover:bg-gray-400/30 cursor-pointer"
                                                >
                                                    <lucide.LuX className="h-4 w-4" />
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptInvite(invite.id, invite.team_id, invite.role )}
                                                    className="w-full px-4 py-2 bg-blue-500 gap-2 hover:bg-blue-600 cursor-pointer justify-center max-w-46 text-black items-center flex rounded-xl"
                                                >
                                                    <lucide.LuCheck className="h-4 w-4" />
                                                    Accept
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className={`space-y-4 ${activeTab === 'notifications' ? 'block' : 'hidden'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DropdownMenu
                                trigger={
                                    <button
                                        className="px-4 py-1.5 text-white gap-3 rounded-lg flex justify-center items-center bg-slate-950 border border-slate-700 hover:bg-gray-400/30 cursor-pointer"
                                    >
                                        <lucide.LuFilter className="h-4 w-4 mr-2 text-white" />
                                        {filter === 'all' ? 'All' : 'Unread'}
                                    </button>
                                }


                                items={[
                                    { label: 'All notifications', onClick: () => setFilter('all') },
                                    { label: 'Unread only', onClick: () => setFilter('unread') }
                                ]}
                            />
                        </div>
                    </div>

                    {filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <lucide.LuMail className="h-12 w-12 text-gray-400/50 mb-4" />
                                <h3 className="text-lg font-medium">
                                    {filter === 'unread' ? 'No unread notification' : 'No notifications'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    You'll see activity notifications here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {filteredNotifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <Card
                                        className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${!notification.read ? 'border-l-2 border-l-blue-500 bg-blue-500/5' : ''
                                            }`}
                                        onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-2 w-2 rounded-full mt-2 ${notification.read ? 'bg-transparent' : 'bg-blue-500'
                                                        }`} />
                                                    <div>
                                                        <h4 className={`font-medium ${notification.read ? 'text-gray-400' : ''}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-400 mt-0 5">
                                                            {notification.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                            <lucide.LuFolderKanban className="h-3 w-3" />
                                                            <span>{projectNames[notification.project_id]}</span>
                                                            <span>•</span>
                                                            <lucide.LuClock className="h-3 w-3" />
                                                            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!notification.read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification.id)
                                                        }}
                                                        className="rounded-lg hover:bg-gray-400/50 p-3 cursor-pointer transition-all"
                                                    >
                                                        <lucide.LuMailOpen className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )
                    }
                </div>
            </div>
        </motion.div>
    )
}