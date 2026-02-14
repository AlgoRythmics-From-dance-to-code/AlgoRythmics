"use client";

import { Search, ChevronRight } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider";

export default function Sidebar({ 
  categories, 
  activeCategory, 
  onSelectCategory 
}: { 
  categories: string[], 
  activeCategory: string, 
  onSelectCategory: (c: string) => void 
}) {
  const { t } = useLocale();

  return (
    <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
      {/* Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder={t("sidebar.search_placeholder")} 
          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 pl-10 text-gray-800 focus:outline-none focus:border-[var(--brand-teal)] transition-colors"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
          {t("sidebar.categories_title")}
        </h3>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
              activeCategory === category 
                ? "bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] border border-[var(--brand-teal)]/20 shadow-sm" 
                : "text-gray-600 hover:bg-gray-100 hover:text-black"
            }`}
          >
            <span>{category}</span>
            {activeCategory === category && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </aside>
  );
}
