// Client Component
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    if (!acceptTerms) newErrors.terms = "You must accept the terms";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate register API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    // Redirect to login
    router.push("/login");
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-[calc(100vh-85px)]">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-85px)]">
        {/* Left Side: Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden lg:w-[40%] xl:w-[45%] bg-[#F0FBF9] dark:bg-[#112220]"
        >
          <div className="w-3/4 max-w-[500px]">
            <Image
              src="/assets/algo_group_119.svg"
              alt="Register illustration"
              width={600}
              height={600}
              className="w-full h-auto opacity-90"
            />
          </div>
          <div className="absolute rounded-full" style={{ right: "5%", top: "8%", width: "140px", height: "140px", backgroundColor: "#36D6BA", opacity: 0.15 }} />
          <div className="absolute rounded-full" style={{ left: "5%", bottom: "8%", width: "200px", height: "200px", backgroundColor: "#269984", opacity: 0.1 }} />
        </div>

        {/* Right Side: Register Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[500px]">
            <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-black dark:text-white mb-3">Register</h1>
            <p className="font-montserrat text-base sm:text-lg mb-8 text-[#666] dark:text-gray-400">
              Create your account to get started.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Name fields */}
              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <div className="flex-1">
                  <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">First name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full font-montserrat h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="First name" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div className="flex-1">
                  <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Last name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className={`w-full font-montserrat h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Last name" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="mb-5">
                <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`w-full font-montserrat h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter your email" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`w-full font-montserrat h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Create a password" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="mb-5">
                <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full font-montserrat h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm your password" />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer font-montserrat text-sm">
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="w-5 h-5 accent-[#36D6BA] mt-0.5" />
                  <span className="text-black dark:text-white">
                    I accept the{" "}
                    <Link href="#" className="font-bold" style={{ color: "#36D6BA" }}>Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="#" className="font-bold" style={{ color: "#36D6BA" }}>Privacy Policy</Link>
                  </span>
                </label>
                {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
              </div>

              {/* Register button */}
              <button className="w-full font-montserrat font-bold text-white h-12 sm:h-14 rounded-lg text-lg sm:text-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#269984", border: "none" }}
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center font-montserrat mt-6 text-sm sm:text-base text-[#666] dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-bold hover:underline" style={{ color: "#36D6BA" }}>Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
