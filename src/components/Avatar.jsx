

export const Avatar = ({ profile, className, }) => {
    return profile?.avatar_url ? (
        <img 
            className={`${className} rounded-full ring-2 ring-indigo-500/50 shadow-lg object-cover`}
            src={profile.avatar_url} 
            alt={profile.username}
        />
    ) : (
        <div className={`${className} rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-indigo-400/50`}>
            {profile?.username?.charAt(0).toUpperCase()}
        </div>
    );
};
