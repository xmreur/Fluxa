const Input = ({ className, type, ...props}, ref) => {
    return (
        <input
            type={type}
            className={`flex h-10 w-full rounded-md border border-slate-700 px-3 py-2 text-base ring-offset-cyan-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
            ref={ref}
            {...props}
        />
        
    )
}

export default Input