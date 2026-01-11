import { useState, useEffect } from "react"
import { supabase } from "../../supabase-client";
import * as lucide from 'react-icons/lu'
import { motion } from "framer-motion";
import { Card, CardContent } from "../Card";
import { DropdownMenu } from "../DropdownMenu";
import { IoIosMore } from "react-icons/io";

export const ProjectMembers = ({ projectId, setMembersAmount, userRole, toUpdate }) => {
    const [members, setMembers] = useState([])
    const [memberRoles, setMemberRoles] = useState({})
    const [loading, setLoading] = useState(true)

    // Capitalize role string
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ""

    // Load members + profiles
    const loadData = async () => {
        setLoading(true)

        const { data: membersData, error: membersError } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', projectId)

        if (!membersData) return setLoading(false)
        setMembersAmount(membersData.length)

        const memberIds = membersData.map(m => m.user_id)

        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, email, avatar_url')
            .in('id', memberIds)

        // Merge profiles with roles
        const profilesWithRole = profilesData.map(profile => {
            const role = membersData.find(m => m.user_id === profile.id)?.role || "member"
            return { ...profile, role }
        })

        setMembers(profilesWithRole)

        // Set memberRoles map once
        const rolesMap = {}
        profilesWithRole.forEach(m => { rolesMap[m.id] = m.role })
        setMemberRoles(rolesMap)

        setLoading(false)
    }

    useEffect(() => { loadData() }, [projectId, toUpdate === true])

    // Handle role changes
    const handleRoleChange = async (memberId, newRole) => {
        // Optimistically update UI
        setMemberRoles(prev => ({ ...prev, [memberId]: newRole }))

        // Call API to update role
        await updateUserRole(memberId, projectId, newRole)

        // Optional: refresh data if needed
        // await loadData()
    }

    const removeMember = async (memberId) => {

        const {error} = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', memberId)

        if (!error) {
            setMembers(prev => prev.filter(m => m.id !== memberId))
            setMembersAmount(prev => prev - 1)

            await loadData()
            setMembersAmount(members)
        }
    }

    if (loading) return (
        <div className="w-full py-10 flex justify-center items-center">
            <lucide.LuLoaderCircle className='h-12 w-12 text-white animate-spin'/>
        </div>
    )

    return (
        <div className="grid gap-4">
            {members.map((member, index) => (
                <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="hover:border-blue-500/50 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold">
                                        {member.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">{member.username}</p>
                                    <p className="text-sm text-gray-400 flex items-center gap-1">
                                        <lucide.LuMail className="h-3.5 w-3.5" /> {member.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm font-medium">{member.issue_amount || 0} issues</p>
                                    <p className="text-xs text-gray-400">Created or Assigned</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                        ${member.role === "owner" ? "bg-yellow-500/10 text-yellow-600" :
                                        member.role === "admin" ? "bg-blue-500/15 text-blue-400" :
                                        "bg-gray-600/20 text-gray-400"}`}>
                                        {member.role === "owner" ? <lucide.LuCrown className="h-3.5 w-3.5" /> :
                                         member.role === "admin" ? <lucide.LuShield className="h-3.5 w-3.5" /> :
                                         <lucide.LuUser className="h-3.5 w-3.5" />}

                                        {userRole === "owner" && member.role !== "owner" ? (
                                            <select
                                                value={memberRoles[member.id]}
                                                onChange={e => handleRoleChange(member.id, e.target.value)}
                                                className="ml-1 bg-transparent text-white text-xs font-medium border-none outline-none cursor-pointer"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className="ml-1">{capitalize(member.role)}</span>
                                        )}
                                    </div>
                                </div>

                                {userRole === 'owner' && member.role !== 'owner' && (
                                        <div className="flex justify-center items-center">
                                            <DropdownMenu
                                                trigger={
                                                    <button className='w-8 h-8 flex cursor-pointer justify-center items-center bg-transparent hover:bg-gray-500/60 rounded-lg transition-all'>
                                                        <IoIosMore className="w-4 h-4" />
                                                    </button>
                                                }
                                                items={[
                                                    { label: 'Remove from team', icon: lucide.LuTrash2, className: 'text-red-500 hover:text-red-500' },
                                                ]}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
