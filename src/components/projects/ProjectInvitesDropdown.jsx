import * as lucide from "react-icons/lu";
import { Card, CardContent } from "../Card";
import { motion } from "framer-motion";

export const ProjectInvitesDropdown = ({
    invites,
    revokeInvite,
    userRole
}) => {
    if (!invites.length) return null;

    return (
        <Card className="border-dashed border-yellow-500/40">
            <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                    <lucide.LuClock className="h-4 w-4" />
                    Pending invites
                </h3>

                {invites.map((invite, i) => (
                    <motion.div
                        key={invite.invite_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex justify-between items-center"
                    >
                        <div>
                            <p className="text-sm">{invite.email}</p>
                            <p className="text-xs text-gray-400">{invite.role}</p>
                        </div>

                        {userRole === "owner" && (
                            <button
                                onClick={() => revokeInvite(invite.invite_id)}
                                className="text-red-500"
                            >
                                <lucide.LuX />
                            </button>
                        )}
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    );
};
