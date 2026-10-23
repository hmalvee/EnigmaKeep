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
  if (categories.length === 0) {
    return null;
  }

  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
      active ? 'border-ink/20 bg-ink/10 text-ink' : 'border-transparent text-muted hover:bg-ink/5 hover:text-ink'
    }`;

  return (
    <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter by category">
      <button role="tab" aria-selected={selectedCategory === null} onClick={() => onSelectCategory(null)} className={pill(selectedCategory === null)}>
        All
      </button>
      {categories.map(category => (
        <button
          key={category}
          role="tab"
          aria-selected={selectedCategory === category}
          onClick={() => onSelectCategory(selectedCategory === category ? null : category)}
          className={pill(selectedCategory === category)}
        >
          {category}
        </button>
      ))}
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
