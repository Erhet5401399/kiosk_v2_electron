import { motion } from "framer-motion";
import type { Category } from "../../types";

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  categoryServiceCount: Record<string, number>;
  onSelectCategory: (category: string) => void;
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

            return (
              <button
                key={cat.name}
                className={`category-btn-sidebar ${selectedCategory === cat.name ? "active" : ""} ${disabled ? "is-disabled" : ""}`}
                onClick={() => onSelectCategory(cat.name)}
                disabled={disabled}
              >
                <span className="category-icon-wrap">
                  <span className="category-icon">{cat.icon}</span>
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
