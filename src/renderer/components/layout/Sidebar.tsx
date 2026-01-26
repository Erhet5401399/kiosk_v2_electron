import { motion } from 'framer-motion';
import type { Category } from '../../types';

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function Sidebar({ categories, selectedCategory, onSelectCategory }: SidebarProps) {
  const selectedIndex = categories.findIndex((c) => c.name === selectedCategory);

  return (
    <aside className="sidebar">
      <div className="sidebar-pill-container">
        <motion.div
          className="sidebar-active-pill"
          animate={{ y: selectedIndex * 72 }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        />
        <nav className="categories-list">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`category-btn-sidebar ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.name)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
