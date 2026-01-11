import { useState } from 'react';
import { Modal } from './Modal'
import { supabase } from '../../supabase-client';

export const DeleteAccountModal = ({ open, onOpenChange }) => {

    const [loading, setLoading] = useState(false);

    const deleteAccount = async () => {

        const { error } = await supabase.functions.invoke('delete-account');
    }

    return (
        <Modal open={open} onClose={onOpenChange}>

            <h2 className='font-bold text-xl text-white'>Are you absolutely sure?</h2>
            <p className="text-gray-400 text-sm">This action cannot be undone. This will permanently delete your account and remove all of your data.</p>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => { 
                        onOpenChange()
                    }}
                    className="px-4 cursor-pointer py-2 rounded-lg text-gray-400 hover:text-white"
                >
                    Cancel
                </button>

                <button
                    onClick
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-red-500 not-disabled:hover:bg-red-600 not-disabled:cursor-pointer text-white disabled:opacity-50"
                >
                    {loading ? "Deleting..." : "Delete account"}
                </button>
            </div>
        </Modal>
    )
}