import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { IoIosMore } from "react-icons/io";
import { Card, CardContent, CardHeader, CardTitle } from "../Card";
import { supabase } from "../../supabase-client";
import { useState } from "react";

export const ProjectsList = ({ userRole, projects, capitalizeFirstLetter }) => {

    const bugAmount = (issues) => {
        return issues.filter((issue) => issue.type == 'bug').length
    }

    const featuresAmount = (issues) => {
        return issues.filter((issue) => issue.type == 'feature').length
    }

    const solvedIssues = (issues) => {
        return issues.filter((issue) => issue.is_active == false).length
    }

    return (
        <div className="mt-4 flex overflow-x-auto space-x-3 pb-3 shrink-0">
            {projects.map((project, index) => {
                return (
                    <motion.div
                        className="w-1/3"
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="w-full shrink-0 hover:border-gray-500/50 transition-colors cursor-pointer group">
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
                                    <span className="font-medium">{Math.min(100, Math.max(0, isNaN(project.issues.length / solvedIssues(project.issues)) ? 0 : (project.issues.length / solvedIssues(project.issues) * 100)))}%</span>
                                </div>
                                <progress
                                    className="h-1.5 w-full appearance-none rounded-full overflow-hidden
                                        bg-slate-700
                                        [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-bar]:rounded-full
                                        [&::-webkit-progress-value]:bg-blue-500 [&::-webkit-progress-value]:rounded-full
                                        [&::-moz-progress-bar]:bg-blue-500
                                        block"
                                    value={Math.min(100, Math.max(0, isNaN(project.issues.length / solvedIssues(project.issues)) ? 0 : (project.issues.length / solvedIssues(project.issues) * 100)))}
                                    max="100"
                                />

                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            })}
        </div>
    );
};
