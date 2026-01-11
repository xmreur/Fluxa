import * as lucide from 'react-icons/lu'

const TYPE_CONFIG = {
  bug: {
    title: 'Bug',
    icon: lucide.LuBug,
    classes: 'text-red-500 bg-red-500/20',
  },
  feature: {
    title: 'Feature',
    icon: lucide.LuSparkles,
    classes: 'text-purple-500 bg-purple-500/20',
  },
  improvement: {
    title: 'Improvement',
    icon: lucide.LuZap,
    classes: 'text-amber-500 bg-amber-500/20',
  },
  task: {
    title: 'Task',
    icon: lucide.LuSquareCheck,
    classes: 'text-blue-500 bg-blue-500/20',
  },
}

export const TypeIndicator = ({ type, className = '' }) => {
  const config = TYPE_CONFIG[type] ?? {
    title: 'Unknown',
    icon: lucide.LuShieldQuestion,
    classes: 'text-gray-400 bg-gray-400/20',
  }

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${config.classes} ${className}`}
    >
      <Icon className="h-4 w-4" />
      {config.title}
    </span>
  )
}
