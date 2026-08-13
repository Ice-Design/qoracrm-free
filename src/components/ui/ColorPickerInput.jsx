import { useState, useRef, useEffect } from 'react';
import { HexAlphaColorPicker } from "react-colorful";

// Helper to click outside
function useClickOutside(ref, handler) {
  useEffect(() => {
    let startedInside = false;
    let startedWhenMounted = false;

    const listener = (event) => {
      if (startedInside || !startedWhenMounted) return;
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    const validateEventStart = (event) => {
      startedWhenMounted = !!ref.current;
      startedInside = ref.current && ref.current.contains(event.target);
    };

    document.addEventListener("mousedown", validateEventStart);
    document.addEventListener("touchstart", validateEventStart);
    document.addEventListener("click", listener);

    return () => {
      document.removeEventListener("mousedown", validateEventStart);
      document.removeEventListener("touchstart", validateEventStart);
      document.removeEventListener("click", listener);
    };
  }, [ref, handler]);
}

export function ColorPickerInput({ color, onChange, label }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  useClickOutside(colorPickerRef, () => setShowColorPicker(false));

  return (
    <div className="flex items-center gap-2 relative" ref={colorPickerRef}>
      <div 
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="w-8 h-8 rounded cursor-pointer border border-gray-200 shadow-sm transition-transform hover:scale-105"
        style={{ backgroundColor: color || '#ffffff' }}
        title={label || "Choose Color"}
      />
      {showColorPicker && (
        <div className="absolute top-full mt-2 left-0 z-50">
          <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 flex flex-col gap-3">
            <HexAlphaColorPicker color={color || '#ffffff'} onChange={onChange} />
            <input 
              type="text" 
              value={color || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full text-center text-xs font-mono border border-gray-200 py-1.5 px-2 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase bg-gray-50"
              placeholder="#FFFFFF"
            />
          </div>
          <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white border-t border-l border-gray-100 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
