import { useState } from "react";
import Input from "../Input";
import { Modal } from "./Modal";
import { supabase } from "../../supabase-client";

export const InviteToTeamModal = ({
    open,
    onClose,
    teamName,
    teamId,
    onCreate,
}) => {

    const [loading, setLoading] = useState(false)
    const [emailValue, setEmailValue] = useState('')
    const [role, setRole] = useState('member')
    const [error, setError] = useState('')

    const inviteToTeam = async () => {
        if (!['member', 'admin'].includes(role)) {
            console.log(role)
            setError('Invalid role selected, gotcha tryna be hacker')
            return 
        }
        /**
         * Flow:
         * 1) Check if user with email X exists
         * 2) Check if not already in team
         * 3) send invite
         */
        console.log(emailValue)
        if (!emailValue.trim()) {
            return
        }

        try {
            console.log('set loading')
            setLoading(true)
            setError('');


            let email = emailValue.trim()
            const { data: userData, error: userDataError } = await supabase
                .from('profiles')
                .select('id,email')
                .eq('email', email)
                .maybeSingle()

            if (userData === null) {
                setError('No user has that email')
                throw new Error('User not found with that email')
            }

            if (userDataError) {
                setError('Temporary error')
                throw new Error(userDataError.message)
            }

            const { data: alreadyInTeam, error: alreadyInTeamError } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', teamId)
                .eq('user_id', userData.id)
                .maybeSingle()

            if (alreadyInTeamError) {
                setError('There was an error checking if the user already is in the team');
                throw new Error(alreadyInTeamError.message)
            }

            const isAlreadyInTeam = (alreadyInTeam !== null)

            if (isAlreadyInTeam) {
                setError('The user is already in the team')
                throw new Error('User is already in the team, cant invite lol')
            }

            // All good, invite the user
            await supabase
                .from('invites')
                .insert({
                    team_id: teamId,
                    invitee_email: email,
                    role: role
                })
                
            setEmailValue('');
            setRole('member');
            setLoading(false)
            onClose();

        } catch (e) {
            console.error('Error while inviting user:', e);
            setLoading(false)
        }
        finally {
            await onCreate();
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-lg text-white font-semibold mb-4">Invite a user to {teamName}</h2>

            <div className="flex flex-col gap-3">
                {error && (
                    <p className="text-red-500 text-center font-semibold">{error}</p>
                )}
                
                <label htmlFor="email" className="text-white">User email</label>
                <Input 
                    name='email'
                    id='email'
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="User email"
                    autoFocus
                    className='w-full px-4 py-2 rounded-lg text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500'
                />

                <label htmlFor="role" className="text-white">User Role (When joined)</label>
                <select
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg  text-white bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500"
                    value={role}
                >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                    Cancel
                </button>

                <button
                    onClick={inviteToTeam}
                    disabled={loading || !emailValue.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-500 not-disabled:hover:bg-blue-600 text-white disabled:opacity-50"
                >
                    { loading ? "Inviting..." : 'Invite'}
                </button>
            </div>
        
        </Modal>
    )
}