import { LuSearch, LuCommand } from "react-icons/lu";
import Input from "./Input";


export const SearchBar = ({value, onChange, placeholder}) => {
    return (
        <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
                type='text'
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className='pl-10 pr-12 transition-all bg-slate-800/50 border-slate-700/50 focus:bg-slate-800 focus:border-slate-600/50'
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                <LuCommand className="h-3 w-3" />
                <span>K</span>
            </div>
        </div>
    )
}