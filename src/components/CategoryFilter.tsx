import { Tag, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Work': 'bg-accent/10 text-accent border-accent/20',
  'Personal': 'bg-success/10 text-success border-success/30',
  'Banking': 'bg-slate/10 text-slate border-slate/30',
  'Social': 'bg-accent-2/10 text-accent-2 border-accent-2/30',
  'Shopping': 'bg-accent-2/10 text-accent-2 border-accent-2/30',
  'Entertainment': 'bg-danger/10 text-danger border-danger/30',
  'Email': 'bg-accent/10 text-accent border-accent/20',
  'Development': 'bg-accent/10 text-accent border-accent/20',
  'Other': 'bg-surface2 text-muted border-line',
};

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const getCategoryStyle = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-muted text-sm">
        <Tag size={16} />
        <span>Categories:</span>
      </div>

      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          selectedCategory === null
            ? 'bg-accent/10 text-accent border border-accent/20'
            : 'bg-surface2 text-muted border border-line hover:border-accent/40'
        }`}
      >
        All
      </button>

      {categories.map(category => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
            selectedCategory === category
              ? getCategoryStyle(category)
              : 'bg-surface2 text-muted border-line hover:border-accent/40'
          }`}
        >
          {category}
        </button>
      ))}

      {selectedCategory && (
        <button
          onClick={() => onSelectCategory(null)}
          className="p-1.5 text-muted hover:text-ink hover:bg-surface2 rounded-lg transition-colors"
          title="Clear filter"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal',
  'Banking',
  'Social',
  'Shopping',
  'Entertainment',
  'Email',
  'Development',
  'Other'
];

export { CATEGORY_COLORS };
