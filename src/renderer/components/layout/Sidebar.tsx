import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Category } from "../../types";

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  categoryServiceCount: Record<string, number>;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_ICON_PALETTE = [
  { bg: "rgba(11, 86, 184, 0.15)", fg: "#0B56B8" },
  { bg: "rgba(15, 138, 82, 0.16)", fg: "#0F8A52" },
  { bg: "rgba(180, 83, 9, 0.16)", fg: "#B45309" },
  { bg: "rgba(109, 40, 217, 0.16)", fg: "#6D28D9" },
  { bg: "rgba(14, 116, 144, 0.16)", fg: "#0E7490" },
  { bg: "rgba(190, 18, 60, 0.16)", fg: "#BE123C" },
];

function hashCategory(cat: Category): number {
  const seed = String(cat.id ?? cat.name ?? "");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function CategoryGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="category-glyph" aria-hidden="true">
      <path
        d="M12 4.2L14.2 8.7L19.2 9.4L15.6 12.9L16.4 17.8L12 15.5L7.6 17.8L8.4 12.9L4.8 9.4L9.8 8.7L12 4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar({
  categories,
  selectedCategory,
  categoryServiceCount,
  onSelectCategory,
}: SidebarProps) {
  const selectedIndex = categories.findIndex(
    (c) => c.name === selectedCategory,
  );
  const safeSelectedIndex = Math.max(0, selectedIndex);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Үйлчилгээнүүд</span>
      </div>
      <div className="sidebar-pill-container">
        <motion.div
          className="sidebar-active-pill"
          animate={{ y: safeSelectedIndex * 72 }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
        />
        <nav className="categories-list">
          {categories.map((cat) => {
            const serviceCount = Number(categoryServiceCount[cat.name] || 0);
            const disabled = serviceCount <= 0;
            const palette = CATEGORY_ICON_PALETTE[hashCategory(cat) % CATEGORY_ICON_PALETTE.length];

            return (
              <button
                key={cat.name}
                className={`category-btn-sidebar ${selectedCategory === cat.name ? "active" : ""} ${disabled ? "is-disabled" : ""}`}
                onClick={() => onSelectCategory(cat.name)}
                disabled={disabled}
              >
                <span
                  className="category-icon-wrap"
                  style={{
                    "--category-icon-bg": palette.bg,
                    "--category-icon-fg": palette.fg,
                  } as CSSProperties}
                >
                  <span className="category-icon">
                    <CategoryGlyph />
                  </span>
                </span>
                <span className="category-name">{cat.name}</span>
                <span className="category-item-count">{serviceCount}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
