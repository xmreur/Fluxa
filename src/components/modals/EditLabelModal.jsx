import { useState } from "react";
import Input from "../Input";
import { Modal } from "./Modal";
import { supabase } from "../../supabase-client";

export const EditLabelModal = ({
    open,
    onClose,
    onEdit,
    name,
    color,
    labelId
}) => {
    const [loading, setLoading] = useState(false);

    const [nameValue, setNameValue] = useState(name);
    const [colorValue, setColorValue] = useState(color)

    const editLabel = async () => {
        if (!nameValue.trim()) return
        try {
            setLoading(true)

            const { data: label, error: labelError } = await supabase
                .from('labels')
                .update({
                    name: nameValue.trim(),
                    color: colorValue.trim(),
                })
                .eq('id', labelId)

            if (labelError) throw new Error(labelError.message);

            setNameValue(nameValue)
            setColorValue(colorValue)
            setLoading(false)
            onClose()
        } catch(e) {
            console.error('Failed to create team:', e);
            setLoading(false);
        } finally {
            await onEdit()
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-lg text-white font-semibold mb-4">Create Team</h2>

            <div className="flex flex-col gap-3">
                <label htmlFor="name" className="text-white">Label name</label>
                <Input
                    name='name'
                    id='name'
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="e.g., frontend"
                    autoFocus
                    className="w-full px-4 py-2 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                />

                <label htmlFor="description" className="text-white">Color</label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="color"
                        value={colorValue}
                        onChange={(e) => setColorValue(e.target.value)}
                        className="w-10 h-16 max-w-17 rounded cursor-pointer border-0"
                    />
                    <Input 
                        value={colorValue}
                        onChange={(e) => setColorValue(e.target.value)}
                        className="flex-1 text-white"
                    />
                </div>
            </div>
            <div className="pt-2">
                <p className="text-sm text-gray-400 mb-2">Preview</p>
                <span
                    className="px-2 py-1 rounded text-sm font-medium"
                    style={{
                        backgroundColor: `${colorValue}20`,
                        color: colorValue
                    }}
                >
                    { nameValue || 'label' }
                </span>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => { 
                        setNameValue(name)
                        setColorValue(color)
                        onClose()
                    }}
                    className="px-4 cursor-pointer py-2 rounded-lg text-gray-400 hover:text-white"
                >
                    Cancel
                </button>

                <button
                    onClick={editLabel}
                    disabled={loading || !nameValue.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-500 not-disabled:hover:bg-blue-600 not-disabled:cursor-pointer text-white disabled:opacity-50"
                >
                    {loading ? "Editing..." : "Edit"}
                </button>
            </div>
        </Modal>
    );
};
