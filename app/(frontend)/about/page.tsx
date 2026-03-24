'use client';

import Image from 'next/image';

const teamMembers = [
  { name: 'Dr. Sarah Chen', role: 'Founder & Lead Researcher', initials: 'SC', color: '#269984' },
  { name: 'Mark Williams', role: 'Creative Director', initials: 'MW', color: '#36D6BA' },
  { name: 'Anna Kovács', role: 'Frontend Developer', initials: 'AK', color: '#FBB03B' },
  { name: 'David Park', role: 'Algorithm Specialist', initials: 'DP', color: '#6C63FF' },
];

const steps = [
  {
    number: '01',
    title: 'Choose an Algorithm',
    description:
      'Select from our comprehensive library of sorting, searching, and backtracking algorithms to explore.',
  },
  {
    number: '02',
    title: 'Select Learning Mode',
    description:
      'Pick your preferred way to learn — watch videos, interact with animations, or take manual control.',
  },
  {
    number: '03',
    title: 'Learn & Practice',
    description:
      'Understand the algorithm step-by-step with visual aids, music, and dance choreography.',
  },
  {
    number: '04',
    title: 'Create & Share',
    description:
      'Build your own inputs, test edge cases, and share your learning progress with the community.',
  },
];

export default function AboutPage() {
  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl lg:text-[56px] mb-5 text-center">
          About Us
        </h1>
        <p
          className="font-montserrat text-center text-base sm:text-lg lg:text-xl max-w-3xl text-[#666] dark:text-gray-400"
          style={{ lineHeight: '1.8em' }}
        >
          AlgoRythmics transforms algorithm learning into an engaging, musical experience. We
          combine dance, music, and interactive technology to make complex concepts intuitive and
          fun.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-montserrat font-bold text-2xl sm:text-3xl lg:text-4xl mb-6 text-[#36D6BA]">
              Our Mission
            </h2>
            <p
              className="font-montserrat text-base sm:text-lg mb-5 text-[#333] dark:text-gray-300"
              style={{ lineHeight: '2em' }}
            >
              We believe that algorithms don&apos;t have to be intimidating. Through the universal
              language of music and movement, we make sorting and searching algorithms accessible to
              everyone — from first-year CS students to curious learners of all ages.
            </p>
            <p
              className="font-montserrat text-base sm:text-lg text-[#333] dark:text-gray-300"
              style={{ lineHeight: '2em' }}
            >
              Our platform combines folk dance traditions from around the world with algorithm
              visualizations, creating a unique and memorable learning experience that bridges
              culture and technology.
            </p>
          </div>
          <div className="flex-shrink-0 w-60 sm:w-72 md:w-80 lg:w-96">
            <Image
              src="/assets/algo_group_166.svg"
              alt="Our Mission"
              width={400}
              height={400}
              className="w-full h-auto dark:invert dark:hue-rotate-180"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="px-6 py-12 md:py-20 bg-[#FAFAFA] dark:bg-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-montserrat font-bold text-center text-2xl sm:text-3xl lg:text-4xl text-black dark:text-white mb-4">
            Our Team
          </h2>
          <p className="font-montserrat text-center text-base sm:text-lg mb-12 text-[#666] dark:text-gray-400">
            Meet the passionate people behind AlgoRythmics
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="flex flex-col items-center p-6 sm:p-8 bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="flex items-center justify-center rounded-full font-montserrat font-bold text-white mb-5 w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <h3 className="font-montserrat font-bold text-center text-base sm:text-lg text-black dark:text-white mb-2">
                  {member.name}
                </h3>
                <p className="font-montserrat text-center text-sm text-[#666] dark:text-gray-400">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
        <h2 className="font-montserrat font-bold text-center text-2xl sm:text-3xl lg:text-4xl text-black dark:text-white mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center rounded-full font-montserrat font-bold text-white mb-5 w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl"
                style={{ backgroundColor: '#269984' }}
              >
                {step.number}
              </div>
              <h3 className="font-montserrat font-bold text-lg sm:text-xl mb-3 text-[#36D6BA]">
                {step.title}
              </h3>
              <p
                className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400"
                style={{ lineHeight: '1.8em' }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center justify-center px-6 py-16 md:py-20 bg-[#269984] dark:bg-[#0a0a0a]">
        <h2 className="font-montserrat font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-4 text-center">
          Ready to Start Learning?
        </h2>
        <p className="font-montserrat text-center text-base sm:text-lg mb-8 max-w-xl text-white/80">
          Join thousands of students who have discovered the joy of learning algorithms through
          music and dance.
        </p>
        <a
          href="/register"
          className="font-montserrat font-bold text-white px-10 py-4 rounded-lg text-lg sm:text-xl hover:opacity-90 transition-all bg-[#36D6BA]"
          style={{ textDecoration: 'none' }}
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
