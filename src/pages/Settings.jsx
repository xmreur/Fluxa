import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import * as lucide from 'react-icons/lu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card";
import Input from "../components/Input";
import { Switch } from "../components/Switch";
import { useState } from "react";
import { supabase } from "../supabase-client";
import { Tabs } from "../components/Tabs";
import { Avatar } from "../components/Avatar";
import { AvatarUploader } from "../components/settings/AvatarUploader";
import { DeleteAccountModal } from "../components/modals/DeleteAccountModal";

export function Settings() {

    const { user, profile, loading } = useAuth();
    const [formData, setFormData] = useState({ email: profile.email, username: profile.username })
    const [error, setError] = useState('')
    const [loadingForm, setLoadingForm] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const updateUserData = async (email, username) => {

        if (email === profile.email && username === profile.username) return // no sense changing same data

        setLoadingForm(true)
        setError('');

        // the username changed, check availability
        if (username !== profile.username) {
            const { data: exists } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();

            if (exists !== null) { // Username is taken
                setError('The username is taken already')
                setLoadingForm(false)
                return
            }
        }

        if (email !== profile.email) {
            const { data: exists } = await supabase.from('profiles').select('email').eq('email', email).maybeSingle();

            if (exists !== null) { // Email taken already
                setError('Email already in use by another account')
                setLoadingForm(false)
                return
            }
        }

        try {
            await supabase
                .from('profiles')
                .update({ username })
                .eq('id', user.id);

            await supabase.auth.updateUser({
                data: {
                    display_name: username
                }
            })

            if (email !== profile.email) {
                await supabase.auth.updateUser({ email })
            }

            setLoadingForm(false)
        } catch (e) {
            console.error('Error updating user:', e)
            setError('Something went wrong, please try again in a few seconds')
            setLoadingForm(false)
        }
    }

    const changeAvatar = async (file) => {
        if (!file) return;

        try {
            setLoadingForm(true);
            setError('');

            // 1️⃣ Generate a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { publicUrl, error: urlError } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(fileName);

            if (urlError) throw urlError;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            profile.avatar_url = publicUrl;
            setLoadingForm(false);
        } catch (e) {
            console.error('Error updating avatar:', e);
            setError('Failed to update avatar. Please try again.');
            setLoadingForm(false);
        }
    };


    const tabs = [
        { value: 'profile', name: 'Profile', icon: lucide.LuUser },
        { value: 'notifications', name: 'Notifications', icon: lucide.LuBell },
        { value: 'appearance', name: 'Appearance', icon: lucide.LuPalette },
        { value: 'security', name: 'Security', icon: lucide.LuShield },
    ]

    const [activeTab, setActiveTab] = useState('profile')

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-full"
        >
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-blue-500/20">
                    <lucide.LuSettings className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400">Manage your account and preferences</p>
                </div>
            </div>

            <Tabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
                noCount={true}
            />

            <div className="mt-5"></div>

            <div className={`space-y-6 ${activeTab === 'profile' ? 'block' : 'hidden'}`}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <lucide.LuUser className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <AvatarUploader profile={profile} user={user} />
                        <div className="border-b border-b-gray-700" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="username" className="text-sm">Display Name</label>
                                <Input id='username' value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder='Your name' />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="text-sm">Email</label>
                                <Input id='email' value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder='email@example.com' />
                            </div>
                        </div>
                        <button
                            onClick={() => updateUserData(formData.email, formData.username)}
                            className="w-full bg-blue-500 hover:bg-blue-600 cursor-pointer justify-center max-w-46 text-black items-center flex py-3 rounded-xl"
                        >
                            {loadingForm ? 'Updating...' : 'Save Changes'}
                        </button>
                        {error && (
                            <p className="text-red-500 font-semibold text-center w-full">{error}</p>
                        )}
                    </CardContent>
                </Card>
            </div>


            <div className={`space-y-6 ${activeTab === 'notifications' ? 'block' : 'hidden'}`}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <lucide.LuBell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Manage how you receive updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h4 className="text-sm font-medium">Delivery Methods</h4>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Email notifications</p>
                                <p className="text-sm text-gray-400">Receive emails for issues updates</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Push notifications</p>
                                <p className="text-sm text-gray-400">Get notified in your browser</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Weekly digest</p>
                                <p className="text-sm text-gray-400">Summary of weekly activity</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                    <CardContent className="space-y-4">
                        <h4 className="text-sm font-medium">Issue Events</h4>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Email notifications</p>
                                <p className="text-sm text-gray-400">Receive emails for issues updates</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Push notifications</p>
                                <p className="text-sm text-gray-400">Get notified in your browser</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium">Weekly digest</p>
                                <p className="text-sm text-gray-400">Summary of weekly activity</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className={`space-y-6 ${activeTab === 'appearance' ? 'block' : 'hidden'}`}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <lucide.LuPalette className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                        <CardDescription>Manage how you receive updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Dark mode</p>
                                <p className="text-sm text-gray-400">Use dark theme</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Compact mode</p>
                                <p className="text-sm text-gray-400">Reduce spacing and padding</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className={`space-y-6 ${activeTab === 'security' ? 'block' : 'hidden'}`}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <lucide.LuPalette className="h-5 w-5" />
                            Password
                        </CardTitle>
                        <CardDescription>Change your password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Dark mode</p>
                                <p className="text-sm text-gray-400">Use dark theme</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between border-b border-b-gray-700 py-3">
                            <div>
                                <p className="font-medium">Compact mode</p>
                                <p className="text-sm text-gray-400">Reduce spacing and padding</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sessions</CardTitle>
                        <CardDescription>Manage your active sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <button
                            onClick={async () => { await supabase.auth.signOut({ scope: 'others' }) }}
                            className="px-4 py-2 text-white gap-2 rounded-lg flex justify-center items-center bg-slate-950 border border-gray-400/30 hover:bg-gray-400/30 cursor-pointer"
                        >
                            <lucide.LuLogOut className="h-4 w-4" />
                            Disconnect from other devices
                        </button>
                    </CardContent>
                </Card>

                <Card className="border-red-500/50!">
                    <CardHeader >
                        <CardTitle className="text-red-500">Danger Zone</CardTitle>
                        <CardDescription>Irreversible actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <button className="bg-red-500 rounded-lg px-4 py-2 flex gap-2 items-center cursor-pointer" onClick={() => setShowDeleteModal(true)}>
                            <lucide.LuTrash2 className="h-4 w-4" />
                            Delete account
                        </button>

                        <DeleteAccountModal open={showDeleteModal} onOpenChange={setShowDeleteModal} />
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    )
}