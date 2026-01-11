

export const Label = ({ label }) => {
    return (
        <span
            className={`px-2 py-1 rounded text-sm font-medium ${className}`}
            style={{
                backgroundColor: `${label.color}20`,
                color: label.color
            }}
        >
            { label.name || 'label' }
        </span>
    )
}