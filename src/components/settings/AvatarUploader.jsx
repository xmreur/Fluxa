import { useState, useRef } from "react";
import { Avatar } from "../../components/Avatar";
import * as lucide from "react-icons/lu";
import { supabase } from "../../supabase-client";

export function AvatarUploader({ profile, user }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

    const fileInputRef = useRef(null); // ✅ ref to trigger input click

    const changeAvatar = async (file) => {
        if (!file) return;
        setLoading(true);
        setError("");

        try {
            if (!file.type.startsWith("image/")) {
                setError("File must be an image");
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                setError("File too large (max 2MB)");
                return;
            }

            const mimeToExt = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/gif": "gif",
                "image/webp": "webp",
            };

            const fileExt = mimeToExt[file.type] || file.name.split('.').pop() || "png";
            const fileName = `${user.id}.${fileExt}`;

            if (avatarUrl) {
                const oldFileName = avatarUrl.split('/').pop().split('?')[0];
                if (oldFileName !== fileName) {
                    await supabase.storage.from("avatars").remove([oldFileName]);
                }
            }

            const { data, error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);

            const publicUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", user.id);
            if (updateError) throw updateError;

            setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
        } catch (e) {
            console.error(e);
            setError("Failed to update avatar. Please try again.");
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="flex items-center gap-4">
            <div className="relative">
                <Avatar profile={{ ...profile, avatar_url: avatarUrl }} className="h-20 w-20" />
                {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <lucide.LuLoader className="h-6 w-6 animate-spin text-white" />
                    </div>
                )}
                {/* Hidden input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files?.[0]) changeAvatar(e.target.files[0]);
                    }}
                />
            </div>

            <div className="flex flex-col">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-white gap-2 rounded-lg flex justify-center items-center bg-transparent border border-gray-400/30 hover:bg-gray-400/30 cursor-pointer"
                >
                    <lucide.LuCamera className="h-4 w-4" />
                    Change Avatar
                </button>
                <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG or GIF, Max 2MB.
                </p>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        </div>
    );
}
