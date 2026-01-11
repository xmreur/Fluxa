import { useState, useRef, useEffect } from "react";
import * as lucide from "react-icons/lu";
import { motion } from "framer-motion";

export const DropdownMenu = ({ 
  trigger, 
  items = [], 
  side = "bottom", 
  align = "start",
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null); // null initially
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape
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

  // Calculate position whenever we open
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      const spaceBottom = window.innerHeight - rect.bottom;

      let x = rect.left;
      let y = rect.bottom + 8;

      // Auto-position
      if (spaceRight < 200) x = rect.right - 200; // align end
      if (spaceBottom < 200) {
        const menuHeight = dropdownRef.current?.offsetHeight ?? 200;
        y = rect.top - menuHeight - 8; // flip above
      }

      setPosition({ x, y });
    }
  }, [open]);

  // Handle click on trigger
  const handleToggle = (e) => {
    e.stopPropagation();

    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = rect.left;
      let y = rect.bottom + 8;
      const spaceRight = window.innerWidth - rect.right;
      const spaceBottom = window.innerHeight - rect.bottom;

      if (spaceRight < 200) x = rect.right - 200;
      if (spaceBottom < 200) {
        const menuHeight = dropdownRef.current?.offsetHeight ?? 200;
        y = rect.top - menuHeight - 8;
      }

      setPosition({ x, y });
    }

    setOpen(!open);
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        className="cursor-pointer select-none"
        onClick={handleToggle}
      >
        {trigger}
      </div>

      {open && position && (
        <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }} // small slide from above
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`fixed z-50 min-w-40 w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl shadow-black/30 py-1.5 px-1.5 ${className}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`, // use top for absolute placement
                transform: align === "end" ? "translateX(-100%)" : "none",
            }}
        >

          {items.map((item, index) => (
            <button
              key={item.value || index}
              className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-left text-white/90 hover:bg-slate-700/50 rounded-lg transition-all duration-150 group ${item.className || ''}`}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick?.();
                setOpen(false);
              }}
            >
              {item.icon && (
                <item.icon className={`h-4 w-4 shrink-0 ${item.className || ''}`} />
              )}
              <span className="truncate">{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto text-xs text-slate-500">{item.shortcut}</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};
