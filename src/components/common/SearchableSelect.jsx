import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SearchableSelect – text input + dropdown arrow that filters options as user types.
 * Accepts array of strings or { label, value } objects.
 */
export default function SearchableSelect({
  label,
  value = "",
  onChange,
  options = [],
  placeholder = "Chọn",
  disabled = false,
  required = true,
  emptyMessage = "Không có dữ liệu để hiển thị.",
  noMatchMessage = "Không tìm thấy kết quả",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options
      .map((opt) => {
        if (typeof opt === "string") {
          return { label: opt, value: opt };
        }
        if (opt && typeof opt === "object") {
          const label = opt.label ?? opt.value ?? "";
          const value = opt.value ?? opt.label ?? "";
          return { label: String(label), value: String(value) };
        }
        return null;
      })
      .filter((opt) => opt && opt.label);
  }, [options]);

  useEffect(() => {
    const selected = normalizedOptions.find((opt) => opt.value === String(value));
    if (selected) {
      setQuery(selected.label);
    } else {
      setQuery(value ? String(value) : "");
    }
  }, [value, normalizedOptions]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!query) return normalizedOptions;
    const q = query.trim().toLowerCase();
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  const handleSelect = (next) => {
    onChange?.(next.value);
    setQuery(next.label);
    setOpen(false);
  };

  const showMenu = open && !disabled;

  return (
    <div className={`searchable-select ${disabled ? "is-disabled" : ""} ${showMenu ? "is-open" : ""} ${className}`} ref={containerRef}>
      {label && <label className="form-label fw-semibold d-block">{label}</label>}
      <div className="searchable-select-control">
        <input
          type="text"
          className="form-control"
          value={query}
          placeholder={placeholder}
          onFocus={() => !disabled && setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredOptions.length > 0) {
              e.preventDefault();
              handleSelect(filteredOptions[0]);
            }
          }}
          disabled={disabled}
          required={required && !disabled}
        />
        <button
          type="button"
          className="searchable-select-toggle"
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          aria-label="Mở danh sách"
        >
          <i className={`bi bi-chevron-${showMenu ? "up" : "down"}`} />
        </button>
      </div>

      {showMenu && (
        <div className="searchable-select-menu">
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-muted small">{emptyMessage}</div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-muted small">{noMatchMessage}</div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`searchable-option ${String(opt.value) === String(value) ? "active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
