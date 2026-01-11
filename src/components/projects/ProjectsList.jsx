import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { IoIosMore } from "react-icons/io";
import { Card, CardContent, CardHeader, CardTitle } from "../Card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const ProjectsList = ({ userRole, projects, capitalizeFirstLetter, showModal, teamId }) => {

    const bugAmount = (issues) => {
        return issues.filter((issue) => issue.type == 'bug').length
    }

    const featuresAmount = (issues) => {
        return issues.filter((issue) => issue.type == 'feature').length
    }

    const solvedIssues = (issues) => {
        return issues.filter((issue) => issue.is_active == false).length
    }

    const navigate = useNavigate()

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, index) => {
                return (
                    <motion.div

                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => { navigate(`/projects/${project.id}`) }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="w-full shrink-0 hover:border-blue-500/50 transition-colors cursor-pointer group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className={`w-10 h-10 rounded-lg bg-linear-to-br from-blue-500/90 to-pink-500/50 ${project.color} flex items-center justify-center`}>
                                        <lucide.LuFolderKanban className="h-5 w-5 text-white" />
                                    </div>
                                    <button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IoIosMore className="h-4 w-4" />
                                    </button>
                                </div>
                                <CardTitle className="text-lg mt-3">{project.name}</CardTitle>
                                <p className="text-sm text-gray-400">{project.description}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                    <span className="flex items-center gap-1">
                                        <lucide.LuBug className="h-4 w-4 text-red-500" />
                                        {bugAmount(project.issues)} bugs
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <lucide.LuLightbulb className="h-4 w-4 text-purple-600" />
                                        {featuresAmount(project.issues)} features
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Progress</span>
                                        <span className="font-medium">{project.issues.length > 0 ? Math.min(100, (solvedIssues(project.issues) / project.issues.length) * 100) : 0}%</span>
                                    </div>
                                    <progress
                                        className="h-1.5 w-full appearance-none rounded-full overflow-hidden
                                        bg-slate-700
                                        [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-bar]:rounded-full
                                        [&::-webkit-progress-value]:bg-blue-500 [&::-webkit-progress-value]:rounded-full
                                        [&::-moz-progress-bar]:bg-blue-500
                                        block"
                                        value={project.issues.length > 0 ? Math.min(100, (solvedIssues(project.issues) / project.issues.length) * 100) : 0}
                                        max="100"
                                    />

                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            })}

            {userRole !== 'member' ? (
                <>
                    {/* Add project card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: projects.length * 0.1 }}
                    >
                        <Card
                            onClick={() => showModal(teamId)}
                            className="hover:border-blue-500/50 transition-colors cursor-pointer border-dashed h-full min-h-50 flex items-center justify-center"
                        >
                            <CardContent className='text-center p-6'>
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                    <lucide.LuPlus className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="font-medium">Create Project</p>
                                <p className="text-sm text-gray-400">Add a new project to the team's workspace</p>
                            </CardContent>
                        </Card>

                    </motion.div>
                </>
            ) :
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: projects.length * 0.1 }}
                >
                    <Card
                        onClick={() => showModal(teamId)}
                        className="hover:border-blue-500/50 transition-colors cursor-pointer border-dashed h-full min-h-50 flex items-center justify-center"
                    >
                        <CardContent className='text-center p-6'>
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                <lucide.LuRollerCoaster className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="font-medium">No Projects</p>
                            <p className="text-sm text-gray-400">Ask the owner or an admin to add a project to the team's workspace</p>
                        </CardContent>
                    </Card>

                </motion.div>
            }
        </div>
    );
};
