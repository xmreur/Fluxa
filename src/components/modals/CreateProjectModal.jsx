import { useState } from "react";
import Input from "../Input";
import { Modal } from "./Modal";
import { supabase } from "../../supabase-client";

export const CreateProjectModal = ({
    open,
    onClose,
    onCreate,
    user,
    teamId,
    teamName
}) => {
    const [loading, setLoading] = useState(false);
    const [nameValue, setNameValue] = useState('');
    const [descriptionValue, setDescriptionValue] = useState('')

    const createTeam = async () => {
        if (!nameValue.trim()) return
        try {
            setLoading(true)

            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: nameValue.trim(),
                    description: descriptionValue.trim(),
                    team_id: teamId,
                    created_by: user.id
                })
                .select()
                .single();

            if (projectError) throw new Error(projectError.message);

            const { error: memberError } = await supabase
                .from('project_members')
                .insert({
                    project_id: project.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw new Error(memberError.message);
            
            setNameValue('')
            setDescriptionValue('')
            setLoading(false)
            onClose()
        } catch(e) {
            console.error('Failed to create project:', e);
            setLoading(false);
        } finally {
            await onCreate()
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-lg text-white font-semibold mb-4">Create Project in {teamName}'s Team</h2>

            <div className="flex flex-col gap-3">
                <label htmlFor="name" className="text-white">Project name</label>
                <Input
                    name='name'
                    id='name'
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Project name"
                    autoFocus
                    className="w-full px-4 py-2 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                />

                <label htmlFor="description" className="text-white">Description</label>
                <textarea
                    name="description"
                    id="description"
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="A wonderful description..."
                    className="w-full p-3 h-auto max-h-80 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                ></textarea>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                    Cancel
                </button>

                <button
                    onClick={createTeam}
                    disabled={loading || !nameValue.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-500 not-disabled:hover:bg-blue-600 text-white disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create"}
                </button>
            </div>
        </Modal>
    );
};
