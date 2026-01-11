import { Card, CardContent } from "./Card";
import * as lucide from "react-icons/lu";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { PriorityIndicator } from "./PriorityIndicator";
import { TypeIndicator } from "./TypeIndicator";
import { useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";

export const IssueCard = ({ issue, index }) => {
    const navigate = useNavigate();

    const getStatusIcon = (status) => {
        switch (status) {
            case "todo":
                return <lucide.LuCircle className="h-4 w-4 text-gray-400" />;
            case "in-progress":
                return <lucide.LuClock2 className="h-4 w-4 text-amber-500" />;
            case "done":
                return <lucide.LuCircleCheck className="h-4 w-4 text-green-500" />;
            case "cancelled":
                return <lucide.LuCircleX className="h-4 w-4 text-red-500" />;
            default:
                return <lucide.LuCircleHelp className="h-4 w-4 text-purple-500" />;
        }
    };

    return (
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
                                        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                                    </span>

                                    {issue.issue_labels.length > 0 && (
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
                            <PriorityIndicator priority={issue.priority} />

                            {issue.assignee && (
                                <Avatar profile={issue.assignee} className="w-7 h-7"/>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
