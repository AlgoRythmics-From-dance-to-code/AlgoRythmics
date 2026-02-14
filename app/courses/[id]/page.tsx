"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const courseData: Record<string, { title: string; description: string; color: string; icon: string; illAsset: string; modules: { title: string; duration: string; locked: boolean }[] }> = {
  video: {
    title: "Video Course",
    description: "Watch algorithm sorting dances and learn through visual demonstrations of each algorithm step by step.",
    color: "var(--color-course-video)", icon: "🎬", illAsset: "algo_group_109.svg",
    modules: [
      { title: "Introduction to Sorting", duration: "5 min", locked: false },
      { title: "Bubble Sort Dance", duration: "12 min", locked: false },
      { title: "Selection Sort Waltz", duration: "15 min", locked: false },
      { title: "Insertion Sort Folk", duration: "10 min", locked: true },
      { title: "Merge Sort Tango", duration: "18 min", locked: true },
      { title: "Quick Sort Salsa", duration: "20 min", locked: true },
    ],
  },
  animation: {
    title: "Animation Course",
    description: "Interactive animations that break down complex algorithms into easy-to-understand visual sequences.",
    color: "var(--color-course-animation)", icon: "✨", illAsset: "algo_group_142.svg",
    modules: [
      { title: "How Animations Work", duration: "8 min", locked: false },
      { title: "Bubble Sort Animated", duration: "10 min", locked: false },
      { title: "Selection Sort Animated", duration: "12 min", locked: true },
      { title: "Merge Sort Animated", duration: "15 min", locked: true },
    ],
  },
  control: {
    title: "Control Course",
    description: "Take control and manually step through algorithms to understand every comparison and swap operation.",
    color: "var(--color-course-control)", icon: "🎮", illAsset: "algo_group_119.svg",
    modules: [
      { title: "Getting Started with Controls", duration: "5 min", locked: false },
      { title: "Bubble Sort – Your Turn", duration: "15 min", locked: false },
      { title: "Insertion Sort – Your Turn", duration: "18 min", locked: true },
    ],
  },
  create: {
    title: "Create Course",
    description: "Build your own algorithms, create custom input sets, and watch how different approaches solve the same problem.",
    color: "var(--color-course-create)", icon: "🛠️", illAsset: "algo_group_132.svg",
    modules: [
      { title: "Algorithm Builder Intro", duration: "10 min", locked: false },
      { title: "Build Bubble Sort", duration: "20 min", locked: false },
      { title: "Build Selection Sort", duration: "25 min", locked: true },
    ],
  },
  alive: {
    title: "Alive Course",
    description: "Experience algorithms come alive with real-time music and dance choreography matching each operation.",
    color: "var(--color-course-alive)", icon: "💃", illAsset: "algo_group_166.svg",
    modules: [
      { title: "Dance & Code Intro", duration: "8 min", locked: false },
      { title: "Bubble Sort Dance Party", duration: "12 min", locked: false },
      { title: "Merge Sort Rhythm", duration: "15 min", locked: true },
      { title: "Quick Sort Beats", duration: "18 min", locked: true },
    ],
  },
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const data = courseData[id] || courseData["video"];

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="w-full py-10 md:py-14 bg-[#F0FBF9] dark:bg-[#112220]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Link href="/courses" className="inline-flex items-center gap-2 font-montserrat text-sm mb-6 hover:underline" style={{ color: "#269984" }}>
            ← Back to Courses
          </Link>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <span className="text-3xl sm:text-4xl">{data.icon}</span>
                <h1 className="font-montserrat font-bold text-2xl sm:text-3xl lg:text-4xl text-black dark:text-white">{data.title}</h1>
              </div>
              <p className="font-montserrat text-sm sm:text-base lg:text-lg max-w-lg mx-auto md:mx-0 text-[#666] dark:text-gray-400" style={{ lineHeight: "1.8em" }}>
                {data.description}
              </p>
            </div>
// ...
// ...
            <div className="flex-shrink-0 w-40 sm:w-48 md:w-56 lg:w-64">
              <Image src={`/assets/${data.illAsset}`} alt={data.title} width={280} height={280} className="w-full h-auto dark:invert dark:hue-rotate-180" />
            </div>
// ...
// ...
          </div>
        </div>
      </div>

      {/* Course Modules */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Module List */}
          <div className="flex-1">
            <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-black dark:text-white mb-6">Course Modules</h2>
            <div className="space-y-3">
              {data.modules.map((mod, i) => (
                <div key={i}
                  className={`flex items-center justify-between p-4 sm:p-5 rounded-xl transition-all ${
                    mod.locked ? "bg-[#FAFAFA] dark:bg-[#1a1a1a] opacity-70" : "bg-[#F0FBF9] dark:bg-[#112220]"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="flex items-center justify-center rounded-full font-montserrat font-bold text-white flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm"
                      style={{ backgroundColor: mod.locked ? "#CCC" : data.color }}
                    >
                      {i + 1}
                    </div>
                    <span className="font-montserrat font-bold text-sm sm:text-base text-black dark:text-white truncate">{mod.title}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="font-montserrat text-xs sm:text-sm text-[#999] dark:text-gray-500">{mod.duration}</span>
                    {mod.locked && <span className="text-sm">🔒</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="p-6 rounded-2xl sticky top-[110px] bg-[#FAFAFA] dark:bg-[#1a1a1a]">
              <h3 className="font-montserrat font-bold text-lg text-black dark:text-white mb-5">Course Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-[#666] dark:text-gray-400">Modules</span>
                  <span className="font-montserrat font-bold text-sm text-black dark:text-white">{data.modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-[#666] dark:text-gray-400">Total Duration</span>
                  <span className="font-montserrat font-bold text-sm text-black dark:text-white">
                    {data.modules.reduce((sum, m) => sum + parseInt(m.duration), 0)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-[#666] dark:text-gray-400">Status</span>
                  <span className="font-montserrat font-bold text-sm" style={{ color: data.color }}>In Progress</span>
                </div>
              </div>
              <button className="w-full font-montserrat font-bold text-white mt-6 h-11 rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer"
                style={{ backgroundColor: data.color, border: "none" }}>
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
