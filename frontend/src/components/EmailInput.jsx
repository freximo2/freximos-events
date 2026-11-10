import { useState, useRef, useEffect } from 'react';
import { Mail } from 'lucide-react';

const DOMAINS = [
  'vibrameet.com',
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'live.com',
  'icloud.com',
];

export default function EmailInput({ value, onChange, placeholder = 'tu@email.com', required = true }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    setSelectedIdx(-1);

    // Show suggestions when user types @ or has text before @
    const atIdx = val.indexOf('@');
    if (atIdx >= 1) {
      const typed = val.slice(atIdx + 1).toLowerCase();
      const user = val.slice(0, atIdx);
      if (user.length > 0) {
        const filtered = DOMAINS
          .filter(d => d.startsWith(typed) && d !== typed)
          .map(d => `${user}@${d}`);
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    } else if (val.length > 0 && !val.includes('@')) {
      // No @ yet, don't suggest
      setSuggestions([]);
    } else {
      setSuggestions([]);
    }
  }

  function handleKeyDown(e) {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (selectedIdx >= 0 && selectedIdx < suggestions.length) {
        e.preventDefault();
        pick(suggestions[selectedIdx]);
      } else if (suggestions.length > 0 && e.key === 'Tab') {
        e.preventDefault();
        pick(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  }

  function pick(email) {
    onChange(email);
    setSuggestions([]);
    setSelectedIdx(-1);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (value.includes('@')) handleChange({ target: { value } }); }}
        required={required}
        placeholder={placeholder}
        autoComplete="email"
        className="input-modern !pl-10"
      />
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              className={`w-full text-left px-4 py-2 text-sm transition border-b last:border-0 flex items-center gap-2 ${
                i === selectedIdx ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Mail size={12} className="text-gray-400" />
              <span>
                <span className="font-medium">{s.split('@')[0]}</span>
                <span className="text-gray-400">@{s.split('@')[1]}</span>
              </span>
            </button>
          ))}
          <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-400">Tab para aceptar</div>
        </div>
      )}
    </div>
  );
}
