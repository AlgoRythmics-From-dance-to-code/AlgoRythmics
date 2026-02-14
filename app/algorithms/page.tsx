"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Category = "sorting" | "searching" | "backtracking";

interface AlgorithmCard {
  id: string;
  name: string;
  description: string;
  category: Category;
  illAsset: string;
}

const sortingAlgorithms: AlgorithmCard[] = [
  { id: "bubble-sort", name: "Bubble sort", description: "A form of sorting by exchanging that simply interchanges pairs of elements that are out of order in a sequence of passes through the file, until the list is sorted.", category: "sorting", illAsset: "algo_group_109.svg" },
  { id: "insertion-sort", name: "Insertion sort", description: "Insertion sort is a simple sorting algorithm that builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms.", category: "sorting", illAsset: "algo_group_142.svg" },
  { id: "selection-sort", name: "Selection sort", description: "Selection sort is a sorting algorithm, specifically an in-place comparison sort. It has O(n²) time complexity, making it inefficient on large lists.", category: "sorting", illAsset: "algo_group_119.svg" },
  { id: "shell-sort", name: "Shell sort", description: "A sorting algorithm proposed by Donald Shell in 1959, it is a variant of straight insertion sort that allows records to take long leaps rather than single steps.", category: "sorting", illAsset: "algo_group_132.svg" },
  { id: "merge-sort", name: "Merge sort", description: "Merge sort is a divide-and-conquer algorithm that divides the array in half, sorts each half, and then merges them back together in the correct order.", category: "sorting", illAsset: "algo_group_166.svg" },
  { id: "quick-sort", name: "Quick sort", description: "Quick sort selects a pivot element and partitions the array around it, placing smaller elements before and larger after the pivot, then recursively sorts both sides.", category: "sorting", illAsset: "algo_group_167.svg" },
  { id: "heap-sort", name: "Heap sort", description: "Heap sort uses a binary heap data structure. It builds a max-heap from the array, then repeatedly extracts the maximum element to build the sorted array.", category: "sorting", illAsset: "algo_group_168.svg" },
];

const searchingAlgorithms: AlgorithmCard[] = [
  { id: "linear-search", name: "Linear search", description: "A sequential search algorithm that checks each element of the array from the beginning, comparing each element with the desired value.", category: "searching", illAsset: "algo_group_109.svg" },
  { id: "binary-search", name: "Binary search", description: "An efficient search algorithm that repeatedly divides the sorted search interval in half until the target value is found or the interval is empty.", category: "searching", illAsset: "algo_group_142.svg" },
];

const backtrackingAlgorithms: AlgorithmCard[] = [
  { id: "n-queens", name: "N-Queens problem", description: "The N-Queens problem is a classic backtracking problem that involves placing N chess queens on an N×N chessboard so that no two queens threaten each other.", category: "backtracking", illAsset: "algo_group_109.svg" },
];

const categories = [
  { key: "sorting" as const, label: "Sorting algorithms", iconAsset: "algo_sorting_icon.svg" },
  { key: "searching" as const, label: "Searching algorithms", iconAsset: "algo_magnifying_glass.svg" },
  { key: "backtracking" as const, label: "Backtracking algorithms", iconAsset: "algo_backtracking_icon.svg" },
];

function getCategoryAlgorithms(cat: Category): AlgorithmCard[] {
  switch (cat) {
    case "sorting": return sortingAlgorithms;
    case "searching": return searchingAlgorithms;
    case "backtracking": return backtrackingAlgorithms;
  }
}

export default function AlgorithmsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("sorting");
  const algorithms = getCategoryAlgorithms(activeCategory);

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* All algorithms bar + category tabs */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-3 p-4 border border-black dark:border-white/20">
          <Image src="/assets/algo_list_icon.svg" alt="" width={23} height={19} className="w-5 h-4 dark:invert dark:hue-rotate-180" />
          <span className="font-montserrat font-bold text-black dark:text-white text-lg sm:text-2xl">
            All algorithms
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 font-montserrat font-bold transition-all duration-200 py-4 sm:py-5 text-sm sm:text-lg lg:text-xl border border-black dark:border-white/20 ${
                  isActive 
                    ? "bg-brand-teal text-white border-brand-teal dark:border-brand-teal" 
                    : "bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Image
                  src={`/assets/${cat.iconAsset}`}
                  alt=""
                  width={23}
                  height={23}
                  className={`w-5 h-5 ${isActive ? "invert brightness-0" : "dark:invert"}`}
                />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Algorithm Cards */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
        {algorithms.map((algo, index) => (
          <div key={algo.id}>
            {/* Card: alternating layout */}
            <div className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-12`}>
              {/* Illustration */}
              <div className="flex-shrink-0 w-48 sm:w-64 md:w-72 lg:w-80">
                <Image
                  src={`/assets/${algo.illAsset}`}
                  alt={algo.name}
                  width={330}
                  height={330}
                  className="w-full h-auto dark:invert dark:hue-rotate-180"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-montserrat font-bold text-2xl sm:text-3xl lg:text-4xl mb-4 text-brand-teal-light">
                  {algo.name}
                </h2>
                <p className="font-montserrat font-bold text-black dark:text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 max-w-xl mx-auto md:mx-0">
                  {algo.description}
                </p>
                <Link
                  href={`/algorithms/${algo.id}`}
                  className="inline-flex items-center justify-center font-montserrat font-bold transition-colors border-2 border-brand-teal-light text-brand-teal-light hover:bg-brand-teal-light hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black px-8 py-2.5 text-base sm:text-lg rounded-lg"
                >
                  Read more
                </Link>
              </div>
            </div>

            {/* Separator */}
            {index < algorithms.length - 1 && (
              <div className="border-t-2 border-black dark:border-white/20 mt-10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
