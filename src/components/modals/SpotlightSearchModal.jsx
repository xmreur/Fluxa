import * as lucide from 'react-icons/lu'
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from 'react'
import Input from '../Input'
import { useNavigate } from 'react-router'
import { supabase } from '../../supabase-client'

const pages = [
    { id: 'dashboard', title: 'Dashboard', path: '/', icon: <lucide.LuLayoutDashboard className="h-4 w-4" /> },
    { id: 'inbox', title: 'Inbox', path: '/inbox', icon: <lucide.LuInbox className="h-4 w-4" /> },
    { id: 'issues', title: 'My Issues', path: '/issues', icon: <lucide.LuFileText className="h-4 w-4" /> },
    { id: 'projects', title: 'Projects', path: '/projects', icon: <lucide.LuFolderKanban className="h-4 w-4" /> },
    { id: 'teams', title: 'Teams', path: '/teams', icon: <lucide.LuUsers className="h-4 w-4" /> },
    { id: 'settings', title: 'Settings', path: '/settings', icon: <lucide.LuSettings className="h-4 w-4" /> },
]

export const SpotlightSearchModal = ({ open, onOpenChange, user }) => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({
        pages: [],
        projects: [],
        teams: [],
        users: [],
        issues: []
    });

    const [selectedIndex, setSelectedIndex] = useState(0)

    const navigate = useNavigate()


    const searchProjects = async (query) => {
        const { data: memberships } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id)

        const projectIds = memberships?.map(p => p.project_id) ?? []
        if (!projectIds.length) return []

        const { data } = await supabase
            .from('projects')
            .select('id,name,description')
            .in('id', projectIds)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

        return data ?? []
    }

    const searchTeams = async (query) => {
        const { data: memberships } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        const teamIds = memberships?.map(p => p.team_id) ?? []
        if (!teamIds.length) return []

        const { data } = await supabase
            .from('teams')
            .select('id,name,description')
            .in('id', teamIds)

            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

        return data ?? []
    }



    const searchUsers = async (query) => {

        const { data: userTeams, error: teamError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        if (teamError) {
            console.error('Error fetching user teams:', teamError)
            return []
        }

        const teamIds = userTeams?.map(t => t.team_id) ?? []
        if (!teamIds.length) return []  // No teams → no users

        const { data: teamMembers, error: membersError } = await supabase
            .from('team_members')
            .select('user_id')
            .in('team_id', teamIds)
            .neq('user_id', user.id) // exclude current user

        if (membersError) {
            console.error('Error fetching team members:', membersError)
            return []
        }

        const userIds = teamMembers?.map(m => m.user_id) ?? []
        if (!userIds.length) return []

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id,username,email')
            .in('id', userIds)
            .or(`username.ilike.%${query}%,email.ilike.%${query}%`)

        if (profilesError) {
            console.error('Error searching profiles:', profilesError)
            return []
        }

        return profiles ?? []
    }

    const searchIssues = async (query) => {

        const { data: issues, error: issuesError } = await supabase
            .from('issues')
            .select('id,title,description')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);

        if (issuesError) {
            console.error('Error searching issues:', issuesError)
            return []
        }

        return issues ?? []

    }

    useEffect(() => {
        let cancelled = false;

        const runSearch = async () => {
            // Empty query → show static pages
            if (!query.trim() || query.length < 3) {
                if (!cancelled) {
                    setResults({
                        pages: pages.map(page => ({
                            id: page.id,
                            title: page.title,
                            icon: page.icon,
                            path: page.path,
                        })),
                        projects: [],
                        teams: [],
                        users: [],
                        issues: []
                    });
                    setSelectedIndex(0);
                }
                return;
            }

            const [projects, teams, users, issues] = await Promise.all([
                searchProjects(query),
                searchTeams(query),
                searchUsers(query),
                searchIssues(query)
            ]);

            if (!cancelled) {
                setResults({
                    pages: [],
                    projects: projects.slice(0, 5).map(project => ({
                        id: project.id,
                        title: project.name,
                        subtitle: project.description,
                        icon: <lucide.LuFolderKanban className="h-4 w-4" />,
                        path: `/projects/${project.id}`
                    })),
                    teams: teams.slice(0, 5).map(team => ({
                        id: team.id,
                        title: team.name,
                        subtitle: team.description,
                        icon: <lucide.LuUsers className="h-4 w-4" />,
                        path: `/teams#${team.id}`
                    })),
                    users: users.slice(0, 5).map(user => ({
                        id: user.id,
                        title: user.username,
                        subtitle: user.email,
                        icon: <lucide.LuUser className='h-4 w-4' />
                    })),
                    issues: issues.slice(0, 5).map(issue => ({
                        id: issue.id,
                        title: issue.title,
                        subtitle: issue.description,
                        icon: <lucide.LuFileText className='h-4 w-4' />
                    }))
                });
                setSelectedIndex(0);
            }
        }

        runSearch();

        return () => {
            cancelled = true;
        }
    }, [query]);


    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!results.length) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(i => (i + 1) % results.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(i => (i - 1 + results.length) % results.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const item = results[selectedIndex]
            if (item && item.path) {
                navigate(item.path)
                onOpenChange(false)
                setQuery('')
            }
        } else if (e.key === 'Escape') {
            onOpenChange(false)
            setQuery('')
        }
    }

    const handleSelect = (result) => {
        if (result.path) {
            navigate(result.path)
            onOpenChange(false)
            setQuery('')
        }
    }


    // CTRL/Option + K handler
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                onOpenChange(!open)
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onOpenChange])

    /* --------------------------------------------
     * Render
     * ------------------------------------------ */
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50"
                        onClick={() => {
                            console.log()
                            onOpenChange(false)
                            setQuery('')
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => {
                            console.log()
                            onOpenChange(false)
                            setQuery('')
                        }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-600">
                                <lucide.LuSearch className="h-5 w-5 text-gray-400" />
                                <Input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search projects..."
                                    className="border-0 bg-transparent text-white focus-visible:ring-0 p-0 h-auto text-base"
                                />
                                <kbd className="text-gray-400 border border-slate-600 rounded bg-slate-700 px-1.5 text-[10px]">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto p-2">
                                {Object.entries(results).every(([_, arr]) => arr.length === 0) ? (
                                    <div className="py-8 text-center text-gray-400">
                                        No results found for "{query}"
                                    </div>
                                ) : (
                                    Object.entries(results).map(([category, items]) => (
                                        items.length > 0 && (
                                            <div key={category} className="mb-2">
                                                <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-1">{category}</p>
                                                {items.map((result, index) => {
                                                    const globalIndex = 0; // optional: can compute global selected index if needed
                                                    return (
                                                        <button
                                                            key={`${category}-${result.id}`}
                                                            onClick={() => handleSelect(result)}
                                                            onMouseEnter={() => setSelectedIndex(index)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${index === selectedIndex
                                                                    ? 'bg-slate-700 text-slate-300'
                                                                    : 'text-white hover:bg-slate-700/50'
                                                                }`}
                                                        >
                                                            <div className="text-gray-400">{result.icon}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{result.title}</p>
                                                                {result.subtitle && (
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        {result.subtitle}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {index === selectedIndex && result.path && (
                                                                <lucide.LuArrowRight className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
