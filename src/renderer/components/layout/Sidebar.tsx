import type { Category } from "../../types";
import emongoliaIcon from "../../assets/images/emongolia.webp";

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
        <div
          className="sidebar-active-pill"
          style={{ top: safeSelectedIndex * 72 }}
        />
        <nav className="categories-list">
          {categories.map((cat) => {
            const serviceCount = Number(categoryServiceCount[cat.name] || 0);
            const disabled = serviceCount <= 0;

            let iconImageSrc = undefined;

            if (cat.id == 1) {
              iconImageSrc = emongoliaIcon;
            };

            return (
              <button
                key={cat.name}
                className={`category-btn-sidebar ${selectedCategory === cat.name ? "active" : ""}`}
                onClick={() => onSelectCategory(cat.name)}
                disabled={disabled}
              >
                <span className="category-icon-wrap" aria-hidden="true">
                  {iconImageSrc &&
                    <img className="category-icon-image" src={iconImageSrc} alt="" />
                  }
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

