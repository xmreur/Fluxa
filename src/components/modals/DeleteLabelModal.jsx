import { useState } from "react";
import Input from "../Input";
import { Modal } from "./Modal";
import { supabase } from "../../supabase-client";

export const DeleteLabelModal = ({
    open,
    onClose,
    onDelete,
    name,
    labelId
}) => {
    const [loading, setLoading] = useState(false);


    const deleteLabel = async () => {
        try {
            setLoading(true)

            const { data: label, error: labelError } = await supabase
                .from('labels')
                .delete()
                .eq('id', labelId)

            if (labelError) throw new Error(labelError.message);

            setLoading(false)
            onClose()
        } catch(e) {
            console.error('Failed to delete team:', e);
            setLoading(false);
        } finally {
            await onDelete()
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-lg text-white font-semibold mb-4">Are you sure you want to delete {name} label</h2>


            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => { 
                        onClose()
                    }}
                    className="px-4 cursor-pointer py-2 rounded-lg text-gray-400 hover:text-white"
                >
                    Cancel
                </button>

                <button
                    onClick={deleteLabel}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-red-500 not-disabled:hover:bg-red-600 not-disabled:cursor-pointer text-white disabled:opacity-50"
                >
                    {loading ? "Deleting..." : "Delete"}
                </button>
            </div>
        </Modal>
    );
};
