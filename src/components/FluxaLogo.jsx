import * as lucide from 'react-icons/lu';

export default function FluxaLogo({ size, className }) {

    let dim = 8
    if (size == 'big') {
        dim = 10
    }
    return (
        <div className={`${className}`}>
            <div className="flex items-center gap-3">
                <div className={`${dim === 8 ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-linear-to-br from-indigo-900 to-purple-700 flex items-center justify-center`}>
                    <lucide.LuZap className={`${dim === 8 ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                </div>
                <span className={`${dim === 8 ? 'text-2xl' : 'text-3xl'} font-bold text-purple-500`}>Fluxa</span>
            </div>
            <p className={`${dim === 8 ? 'text-sm' : ''} text-gray-400 mt-2`}>Progress, Tracked</p>
        </div>

    )
}