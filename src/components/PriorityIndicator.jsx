import * as lucide from 'react-icons/lu'

export const PriorityIndicator = ({ priority }) => {
/*
{ value: 5, label: 'Critical', icon: lucide.LuCircleAlert},
{ value: 4, label: 'High', icon: lucide.LuArrowUp},
{ value: 3, label: 'Medium', icon: lucide.LuMinus },
{ value: 2, label: 'Low', icon: lucide.LuArrowDown},
{ value: 1, label: 'Very Low', icon: lucide.LuCircle}
*/
    switch (priority) {
        case 5:
            return <lucide.LuCircleAlert className="h-4 w-4 text-red-500" />
        case 4:
            return <lucide.LuArrowUp className="h-4 w-4 text-amber-500" />
        case 3:
            return <lucide.LuMinus className="h-4 w-4 text-amber-400" />
        case 2:
            return <lucide.LuArrowDown className="h-4 w-4 text-gray-400" />
        default:
            return <lucide.LuCircle className="h-4 w-4 text-gray-500" />
    }
}
