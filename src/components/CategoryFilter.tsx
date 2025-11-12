import { Tag, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Work': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Personal': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Banking': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Social': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Shopping': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Entertainment': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Email': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Development': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
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
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Tag size={16} />
        <span>Categories:</span>
      </div>

      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          selectedCategory === null
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
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
              : 'bg-gray-700 text-gray-400 border-gray-600 hover:border-gray-500'
          }`}
        >
          {category}
        </button>
      ))}

      {selectedCategory && (
        <button
          onClick={() => onSelectCategory(null)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
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
