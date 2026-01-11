import { useEffect, useState } from "react";
import Input from "../Input";
import { Modal } from "./Modal";
import { supabase } from "../../supabase-client";

export const EditProjectModal = ({
    open,
    onClose,
    onCreate,
    projectName,
    projectDescription,
    projectId,
    userRole
}) => {
    const [loading, setLoading] = useState(false);
    const [nameValue, setNameValue] = useState(projectName || "");
    const [descriptionValue, setDescriptionValue] = useState(projectDescription || "");

    useEffect(() => {
        setNameValue(projectName || "");
        setDescriptionValue(projectDescription || "");
    }, [projectName, projectDescription]);


    const updateProject = async () => {
        if (!nameValue.trim()) return
        if (userRole === 'member') { }
        try {
            setLoading(true)

            const { data: project, error: projectError } = await supabase
                .from('projects')
                .update({
                    name: nameValue,
                    description: descriptionValue
                })
                .eq('id', projectId)
                .select()
                .single();

            if (projectError) throw new Error(projectError.message);


            setLoading(false)
            onClose()
        } catch (e) {
            console.error('Failed to edit project:', e);
            setLoading(false);
        } finally {
            await onCreate()
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-lg text-white font-semibold mb-4">Edit {projectName}</h2>

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
                    onClick={updateProject}
                    disabled={loading || !nameValue.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-500 not-disabled:hover:bg-blue-600 text-white disabled:opacity-50"
                >
                    {loading ? "Editing..." : "Edit"}
                </button>
            </div>
        </Modal>
    );
};
