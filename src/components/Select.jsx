import { useState, useRef, useEffect } from "react";
import * as lucide from "react-icons/lu";
import { motion } from "framer-motion";

export const Select = ({ 
  className = "", 
  children, 
  value, 
  onValueChange,
  placeholder = "Select...",
  items = [],
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const selectedItem = items.find(item => item.value === value);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        triggerRef.current && !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Calculate position on open
  const [position, setPosition] = useState(null);
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      const spaceBottom = window.innerHeight - rect.bottom;

      let x = rect.left;
      let y = rect.bottom + 8;

      if (spaceRight < 200) x = rect.right - 200;
      if (spaceBottom < 200) {
        y = rect.top - 8; // flip above
      }

      setPosition({ x, y });
    }
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const handleSelect = (item) => {
    onValueChange?.(item.value);
    setOpen(false);
  };

  return (
    <div className="relative w-full select-none">
      <button
        ref={triggerRef}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-700 px-3 py-2 text-base ring-offset-cyan-500 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
        onClick={handleToggle}
        {...props}
      >
        <span className="truncate flex items-center gap-3">
            { selectedItem ? < selectedItem.icon />: ''}
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <lucide.LuChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && position && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 max-h-96 w-(--trigger-width)  bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-xl shadow-2xl shadow-black/30 overflow-auto py-1.5"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            '--trigger-width': `${triggerRef.current?.offsetWidth}px`
          }}
        >
          {items.map((item, index) => (
            <button
              key={item.value || index}
              className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-left text-white/90 hover:bg-slate-700/50 rounded-lg transition-all duration-150 group"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(item);
              }}
            >
              {item.icon && <item.icon className="h-4 w-4 text-white shrink-0" />}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};
