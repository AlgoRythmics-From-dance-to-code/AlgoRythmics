// Client Component
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!message.trim()) newErrors.message = "Message is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setErrors({});
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-14 md:py-20 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl lg:text-5xl mb-4 text-center">Contact Us</h1>
        <p className="font-montserrat text-center text-base sm:text-lg text-[#666] dark:text-gray-400">
          We&apos;d love to hear from you
        </p>
      </div>

      {/* Content: Info + Form */}
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left: Contact Info */}
          <div className="flex-1">
            <h2 className="font-montserrat font-bold text-2xl sm:text-3xl text-black dark:text-white mb-8 md:mb-10 text-center lg:text-left">Get in Touch</h2>

            {/* Email */}
            <div className="flex items-start gap-5 mb-8">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[#F0FBF9] dark:bg-[#112220]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#269984" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-black dark:text-white mb-1">Email</h3>
                <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400">info@algorythmics.com</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-5 mb-8">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[#F0FBF9] dark:bg-[#112220]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#269984" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-black dark:text-white mb-1">Address</h3>
                <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400">123 Algorithm Street, Budapest, Hungary</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[#F0FBF9] dark:bg-[#112220]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#269984" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-black dark:text-white mb-1">Phone</h3>
                <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400">+36 1 234 5678</p>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="flex-1">
            <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-[#FAFAFA] dark:bg-[#1a1a1a]">
              <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 sm:mb-8">Send us a message</h2>
              
              {isSuccess ? (
                 <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded relative text-center">
                  <strong className="font-bold">Message sent!</strong>
                  <span className="block sm:inline"> We will get back to you shortly.</span>
                  <button onClick={() => setIsSuccess(false)} className="mt-4 underline text-sm">Send another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Your name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className={`w-full font-montserrat bg-white dark:bg-[#2a2a2a] dark:text-white h-12 border-2 ${errors.name ? 'border-red-500' : 'border-[#E0E0E0] dark:border-neutral-700'} rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors`}
                      placeholder="John Doe" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div className="mb-5">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Your email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className={`w-full font-montserrat bg-white dark:bg-[#2a2a2a] dark:text-white h-12 border-2 ${errors.email ? 'border-red-500' : 'border-[#E0E0E0] dark:border-neutral-700'} rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors`}
                      placeholder="john@example.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="mb-5">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Subject</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                      className={`w-full font-montserrat bg-white dark:bg-[#2a2a2a] dark:text-white h-12 border-2 ${errors.subject ? 'border-red-500' : 'border-[#E0E0E0] dark:border-neutral-700'} rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors`}
                      placeholder="How can we help?" />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div className="mb-6">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      className={`w-full font-montserrat bg-white dark:bg-[#2a2a2a] dark:text-white h-36 border-2 ${errors.message ? 'border-red-500' : 'border-[#E0E0E0] dark:border-neutral-700'} rounded-lg p-4 text-base outline-none resize-none focus:border-[#36D6BA] transition-colors`}
                      placeholder="Your message..." />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <button className="w-full font-montserrat font-bold text-white h-12 sm:h-13 rounded-lg text-base sm:text-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#269984", border: "none" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
