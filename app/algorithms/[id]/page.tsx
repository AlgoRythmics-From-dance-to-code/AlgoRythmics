"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Algorithm Detail Page Template ────────
const algorithmData: Record<string, { name: string; complexity: string; description: string; illAsset: string; steps: string[] }> = {
  "bubble-sort": {
    name: "Bubble Sort",
    complexity: "O(n²)",
    description: "Bubble sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.",
    illAsset: "algo_group_109.svg",
    steps: ["Compare adjacent elements", "Swap if they are in the wrong order", "Move to the next pair", "Repeat until no swaps are needed", "The list is now sorted"],
  },
  "insertion-sort": {
    name: "Insertion Sort",
    complexity: "O(n²)",
    description: "Insertion sort builds the final sorted array one item at a time. It picks each element and inserts it into its correct position among the previously sorted elements.",
    illAsset: "algo_group_142.svg",
    steps: ["Start with the second element", "Compare with elements to its left", "Shift larger elements right", "Insert the element in its correct position", "Repeat for all remaining elements"],
  },
  "selection-sort": {
    name: "Selection Sort",
    complexity: "O(n²)",
    description: "Selection sort divides the input into sorted and unsorted regions. It repeatedly selects the minimum element from the unsorted region and moves it to the sorted region.",
    illAsset: "algo_group_119.svg",
    steps: ["Find the minimum element in the unsorted region", "Swap it with the first unsorted element", "Expand the sorted region by one", "Repeat until the entire array is sorted"],
  },
  "shell-sort": {
    name: "Shell Sort",
    complexity: "O(n log n)",
    description: "Shell sort is a generalization of insertion sort that allows the exchange of items that are far apart. It starts by sorting pairs of elements far apart and progressively reduces the gap.",
    illAsset: "algo_group_132.svg",
    steps: ["Choose a gap sequence", "Sort elements separated by the gap using insertion sort", "Reduce the gap", "Repeat until the gap is 1", "Perform final insertion sort pass"],
  },
  "merge-sort": {
    name: "Merge Sort",
    complexity: "O(n log n)",
    description: "Merge sort divides the array in half, sorts each half recursively, and merges them back together. It is a stable, divide-and-conquer sorting algorithm.",
    illAsset: "algo_group_166.svg",
    steps: ["Divide the array into two halves", "Recursively sort each half", "Merge the sorted halves", "Compare elements from each half", "Place the smaller element into the result"],
  },
  "quick-sort": {
    name: "Quick Sort",
    complexity: "O(n log n)",
    description: "Quick sort picks a pivot element and partitions the array around it. Elements smaller go left, elements larger go right. It then recursively sorts the sub-arrays.",
    illAsset: "algo_group_167.svg",
    steps: ["Choose a pivot element", "Partition: elements < pivot go left, > pivot go right", "Recursively sort the left partition", "Recursively sort the right partition", "Combine the results"],
  },
  "heap-sort": {
    name: "Heap Sort",
    complexity: "O(n log n)",
    description: "Heap sort uses a binary heap data structure. It builds a max-heap, then repeatedly extracts the maximum element and places it at the end of the sorted portion.",
    illAsset: "algo_group_168.svg",
    steps: ["Build a max-heap from the array", "Extract the root (maximum) element", "Move it to the end of the array", "Heapify the reduced heap", "Repeat until all elements are sorted"],
  },
  "linear-search": {
    name: "Linear Search",
    complexity: "O(n)",
    description: "Linear search checks each element of the list sequentially until it finds the target value or reaches the end of the list.",
    illAsset: "algo_group_109.svg",
    steps: ["Start from the first element", "Compare with the target", "If match, return position", "If no match, move to the next element", "If end of list, target not found"],
  },
  "binary-search": {
    name: "Binary Search",
    complexity: "O(log n)",
    description: "Binary search divides a sorted array in half repeatedly. It compares the middle element with the target and narrows the search to the appropriate half.",
    illAsset: "algo_group_142.svg",
    steps: ["Ensure the array is sorted", "Find the middle element", "Compare with the target", "If target is smaller, search the left half", "If target is larger, search the right half"],
  },
  "n-queens": {
    name: "N-Queens Problem",
    complexity: "O(n!)",
    description: "The N-Queens problem places N queens on an N×N chessboard so that no two queens threaten each other. It uses backtracking to explore all valid placements.",
    illAsset: "algo_group_109.svg",
    steps: ["Place a queen in the first row", "Move to the next row and try each column", "Check if placement is safe (no conflicts)", "If no safe column exists, backtrack", "Repeat until all queens are placed"],
  },
};

const views = ["Video", "Animation", "Control", "Create", "Alive"] as const;

export default function AlgorithmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [activeView, setActiveView] = React.useState<string>("Video");

  const data = algorithmData[id] || {
    name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    complexity: "O(?)",
    description: "Algorithm details coming soon.",
    illAsset: "algo_group_109.svg",
    steps: ["Coming soon"],
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero Banner */}
      <div className="w-full py-10 md:py-14 bg-[#F0FBF9] dark:bg-[#112220]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Link href="/algorithms" className="inline-flex items-center gap-2 font-montserrat text-sm mb-6 hover:underline" style={{ color: "#269984" }}>
            ← Back to Algorithms
          </Link>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-black dark:text-white mb-3">{data.name}</h1>
              <span className="inline-block font-montserrat font-bold text-sm px-4 py-1.5 rounded-full text-white mb-4" style={{ backgroundColor: "#269984" }}>
                Time: {data.complexity}
              </span>
              <p className="font-montserrat text-sm sm:text-base lg:text-lg max-w-lg mx-auto md:mx-0 text-[#666] dark:text-gray-400" style={{ lineHeight: "1.8em" }}>
                {data.description}
              </p>
            </div>
// ...
// ...
            {/* Illustration */}
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-80">
              <Image src={`/assets/${data.illAsset}`} alt={data.name} width={330} height={330} className="w-full h-auto dark:invert dark:hue-rotate-180" />
            </div>
// ...
// ...
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex overflow-x-auto border-b-2 border-[#E0E0E0] dark:border-neutral-800">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className="flex-shrink-0 font-montserrat font-bold transition-all px-5 sm:px-8 py-4 text-sm sm:text-base cursor-pointer whitespace-nowrap"
              style={{
                color: activeView === v ? "#269984" : "", // keep custom color for active, handled via className for inactive
                borderBottom: activeView === v ? "3px solid #269984" : "3px solid transparent",
              }}
            >
              <span className={activeView !== v ? "text-[#999] dark:text-gray-500" : ""}>{v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex items-center justify-center rounded-2xl mb-12 aspect-video max-w-3xl mx-auto bg-[#F8F8F8] dark:bg-[#1a1a1a]">
          <div className="text-center p-6">
            <div className="flex items-center justify-center rounded-full bg-[#F0FBF9] dark:bg-[#112220] mx-auto mb-4 w-16 h-16">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#269984"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
            <p className="font-montserrat font-bold text-lg sm:text-xl text-black dark:text-white mb-2">{activeView} View</p>
            <p className="font-montserrat text-sm" style={{ color: "#999" }}>
              {activeView} content for {data.name} — coming soon
            </p>
          </div>
        </div>

        {/* Steps */}
        <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6">Step-by-Step Guide</h2>
        <div className="space-y-4 max-w-2xl">
          {data.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-[#F8F8F8] dark:bg-[#1a1a1a]">
              <div className="flex items-center justify-center rounded-full font-montserrat font-bold text-white flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 text-sm"
                style={{ backgroundColor: "#269984" }}
              >
                {i + 1}
              </div>
              <p className="font-montserrat text-sm sm:text-base text-black dark:text-white pt-1.5">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
