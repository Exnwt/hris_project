import React from "react";

// =========================================================
// 1. STATISTIC CARD COMPONENT
// =========================================================
export const StatCard = ({ title, count, isActive, onClick, color, bgColor, borderColor }) => {
  const defaultBorder = isActive ? (borderColor || "#2563eb") : "#e2e8f0";
  
  return (
    <div
      onClick={onClick}
      style={{
        background: bgColor || (isActive ? "#f0f6ff" : "#f8fafc"),
        padding: "16px",
        borderRadius: "8px",
        border: `1px solid ${defaultBorder}`,
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <span style={{ fontSize: "12px", color: color || "#64748b", fontWeight: "bold" }}>
        {title}
      </span>
      <span style={{ fontSize: "22px", fontWeight: "bold", marginTop: "5px", color: color || "#0f172a" }}>
        {count}
      </span>
    </div>
  );
};

// =========================================================
// 2. SEARCH & FILTER BAR COMPONENT
// =========================================================
export const FilterBar = ({
  searchQuery,
  onSearchChange,
  placeholder = "Cari data...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  onReset,
}) => {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "10px 12px",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          fontSize: "14px",
          outline: "none",
        }}
      />

      {filterOptions.length > 0 && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "14px",
            background: "#fff",
            minWidth: "180px",
            boxSizing: "border-box",
          }}
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {filterValue && filterValue !== "ALL" && (
        <button
          onClick={onReset}
          style={{
            padding: "10px 12px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          Reset Filter
        </button>
      )}
    </div>
  );
};  