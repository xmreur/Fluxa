import { useState } from "react";
import Input from "../Input";
import { Modal } from "./Modal";
import { supabase } from "../../supabase-client";
import { Select } from "../Select";
import * as lucide from 'react-icons/lu'

export const CreateIssueModal = ({
    open,
    onClose,
    onCreate,
    user,
    projectId,
    projectName
}) => {
    const [loading, setLoading] = useState(false);

    const [nameValue, setNameValue] = useState('');
    const [descriptionValue, setDescriptionValue] = useState('')
    const [typeValue, setTypeValue] = useState('task')
    const [priorityValue, setPriorityValue] = useState(3)

    const createProject = async () => {
        if (!nameValue.trim()) return
        try {
            setLoading(true)

            const { data: issue, error: issueError } = await supabase
                .from('issues')
                .insert({
                    title: nameValue.trim(),
                    description: descriptionValue.trim(),
                    priority: priorityValue,
                    type: typeValue,
                    project_id: projectId,
                    created_by: user.id,
                    assigned_to: user.id,
                    status: 'todo',
                })
                .select()
                .single();

            if (issueError) throw new Error(issueError.message);

            
            setNameValue('')
            setDescriptionValue('')
            setLoading(false)
            onClose()
        } catch(e) {
            console.error('Failed to create issue:', e);
            setLoading(false);
        } finally {
            await onCreate()
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-lg text-white font-semibold mb-4">Create an Issue in {projectName}'s Project</h2>

            <div className="flex flex-col gap-3">
                <label htmlFor="name" className="text-white">Title</label>
                <Input
                    name='title'
                    id='title'
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Issue title"
                    autoFocus
                    className="w-full px-4 py-2 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                />

                <label htmlFor="description" className="text-white">Description</label>
                <textarea
                    name="description"
                    id="description"
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Describe the issue..."
                    className="w-full p-3 h-auto max-h-80 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                ></textarea>

                <div className="flex justify-between items-between gap-3">

                    <div className="flex flex-col flex-1 gap-2">
                        <label htmlFor="type" className="text-white">Type</label>
                        <Select 
                        className="text-white"
                        value={typeValue}
                        onValueChange={setTypeValue}
                        items={[
                            { value: 'bug', label: 'Bug', icon: lucide.LuBug },
                            { value: 'feature', label: 'Feature', icon: lucide.LuSparkles},
                            { value: 'improvement', label: 'Improvement', icon: lucide.LuZap},
                            { value: 'task', label: 'Task', icon: lucide.LuSquareCheck}
                        ]}
                        />
                    </div>

                    <div className="flex flex-col flex-1 gap-2">
                        <label htmlFor="priority" className="text-white">Priority</label>
                        <Select 
                            className="text-white"
                            value={priorityValue}
                            onValueChange={setPriorityValue}
                            items={[
                                { value: 5, label: 'Critical', icon: lucide.LuCircleAlert},
                                { value: 4, label: 'High', icon: lucide.LuArrowUp},
                                { value: 3, label: 'Medium', icon: lucide.LuMinus },
                                { value: 2, label: 'Low', icon: lucide.LuArrowDown},
                                { value: 1, label: 'Very Low', icon: lucide.LuCircle}
                            ]}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                    Cancel
                </button>

                <button
                    onClick={createProject}
                    disabled={loading || !nameValue.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-500 not-disabled:hover:bg-blue-600 text-white disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create"}
                </button>
            </div>
        </Modal>
    );
};
