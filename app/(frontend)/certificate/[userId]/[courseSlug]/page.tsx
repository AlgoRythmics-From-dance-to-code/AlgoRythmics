'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Copy,
  Check,
  Printer,
  ArrowLeft,
  Award,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CertificateData {
  success: boolean;
  userId: number;
  userName: string;
  userEmail: string;
  courseSlug: string;
  courseTitle: string;
  courseSummary: string;
  isCompleted: boolean;
  completedAt: string;
  points: number;
  certificateId: string;
  accentColor: string;
  error?: string;
}

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();

  const userIdStr = (params?.userId as string) || '';
  const courseSlug = (params?.courseSlug as string) || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CertificateData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userIdStr || !courseSlug) return;

    setLoading(true);
    fetch(`/api/certificates/${userIdStr}/${courseSlug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Certificate not found');
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        console.error(err);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userIdStr, courseSlug]);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Certificate link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formatDateEnglish = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0d1117] text-white">
        <Loader2 className="w-12 h-12 text-[#269984] animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Loading certificate...</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0d1117] text-white px-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Certificate Not Found</h2>
          <p className="text-gray-400 text-sm mb-6">
            The requested certificate does not exist or has an invalid ID.
          </p>
          <button
            onClick={() => router.push('/profil')}
            className="inline-flex items-center gap-2 bg-[#269984] hover:bg-[#1f7c6b] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg text-sm"
          >
            <ArrowLeft size={18} />
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          header,
          footer,
          nav,
          .no-print {
            display: none !important;
          }
          html,
          body {
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-certificate-container {
            border: 6px double #269984 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 1.5rem !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#090d14] text-white py-6 px-4 sm:px-6 flex flex-col items-center justify-start">
        {/* Top Action Toolbar (Hidden on print) */}
        <div className="no-print w-full max-w-4xl flex flex-wrap items-center justify-between gap-4 mb-6 bg-neutral-900/90 backdrop-blur-md p-4 rounded-2xl border border-neutral-800 shadow-xl">
          <button
            onClick={() => router.push('/profil')}
            className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-neutral-800"
          >
            <ArrowLeft size={18} />
            <span>Back to Profile</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Copy Public Link Button */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl border border-neutral-700 transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#269984] hover:bg-[#1f7c6b] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#269984]/20"
            >
              <Printer size={18} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Certificate Card Container */}
        <div className="print-certificate-container w-full max-w-4xl bg-gradient-to-b from-[#111827] via-[#0f172a] to-[#111827] text-white rounded-[2.5rem] border-4 border-[#269984]/40 p-6 sm:p-10 shadow-2xl relative overflow-hidden my-auto">
          {/* Decorative Corner Borders */}
          <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#269984]" />
          <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#269984]" />
          <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#269984]" />
          <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#269984]" />

          {/* Background Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#269984]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Inner Frame */}
          <div className="border border-[#269984]/20 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center relative z-10 bg-black/20">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#269984] to-teal-300 p-0.5 shadow-lg shadow-[#269984]/30">
                <div className="w-full h-full bg-[#0d1117] rounded-[0.7rem] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#269984]" />
                </div>
              </div>
              <span className="font-montserrat font-black text-xl tracking-wider text-white">
                Algo<span className="text-[#269984]">Rythmics</span>
              </span>
            </div>

            {/* Certificate Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 uppercase">
                Certificate of Completion
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#269984] to-transparent mx-auto mt-3 rounded-full" />
            </div>

            {/* Certifies That */}
            <p className="text-gray-400 font-medium text-xs sm:text-sm italic mb-2">
              This is to certify that
            </p>

            {/* Student Name */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#269984] tracking-wide my-2 border-b-2 border-[#269984]/30 pb-1.5 px-6 inline-block">
              {data.userName}
            </h2>

            {/* Completed Text */}
            <p className="text-gray-400 font-medium text-xs sm:text-sm italic mt-3 mb-2">
              has successfully completed the course
            </p>

            {/* Course Title */}
            <div className="my-2 max-w-xl">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {data.courseTitle}
              </h3>
            </div>

            {/* Footer Metadata Grid */}
            <div className="w-full grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-800/80 items-center">
              {/* Date of Issue */}
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Date of Issue
                </span>
                <span className="text-xs font-semibold text-white">
                  {formatDateEnglish(data.completedAt)}
                </span>
              </div>

              {/* Seal Badge */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 mb-1">
                  <div className="w-full h-full bg-[#0d1117] rounded-full flex items-center justify-center text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-amber-400/90 uppercase tracking-widest">
                  ALGORHYTHMICS
                </span>
              </div>

              {/* Certificate ID */}
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Certificate ID
                </span>
                <span className="text-[11px] font-mono font-bold text-[#269984] bg-[#269984]/10 px-2 py-0.5 rounded border border-[#269984]/20">
                  {data.certificateId}
                </span>
              </div>
            </div>

            {/* Security Verification */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-emerald-400/80 text-[10px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#269984]" />
              <span>Official AlgoRythmics Verified Certificate</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
