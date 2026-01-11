import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import * as lucide from 'react-icons/lu'
import { Tabs } from "../components/Tabs"
import { Card, CardContent } from "../components/Card"
import { supabase } from "../supabase-client"
import { DropdownMenu } from "../components/DropdownMenu"
import { useAuth } from "../context/AuthContext"

export const Issues = () => {

    const {user, profile, loading} = useAuth()

    const [assigned, setAssigned] = useState([])
    const [created, setCreated] = useState([])

    const [activeTab, setActiveTab] = useState('assigned')

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ""


    const tabs = [
        { value: 'assigned', name: 'Assigned', icon: lucide.LuInbox },
        { value: 'created', name: 'Created', icon: lucide.LuCircleCheck }
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

        //loadTeamNames()
        //loadProjectNames()
    }, [])

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

        // fetchInboxData()
    }, [user])


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
                counts={{ assigned: 0, created: 0 }}
            />

            
            <div className="mt-6 min-w-full min-h-fit">
                
                <div className={`space-y-4 ${activeTab === 'invites' ? 'block' : 'hidden'}`}>

                </div>

                <div className={`space-y-4 ${activeTab === 'notifications' ? 'block' : 'hidden'}`}>

                        <div className="flex items-center gap-2">
                            <DropdownMenu 
                                trigger={
                                    <button
                                        className="px-4 py-1.5 text-white gap-3 rounded-lg flex justify-center items-center bg-slate-950 border border-slate-700 hover:bg-gray-400/30 cursor-pointer"
                                    >
                                        <lucide.LuFilter className="h-4 w-4 mr-2 text-white" />
                                    </button>
                                }


                                items={[
                                    { label: 'All notifications', onClick: () => setFilter('all') },
                                    { label: 'Unread only', onClick: () => setFilter('unread')}
                                ]}
                            />
                        </div>
                </div>
            </div>
        </motion.div>
    )
}