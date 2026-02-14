"use client";

export default function Footer() {
  return (
    <footer className="w-full" style={{ backgroundColor: "#269984" }}>
      <div
        className="mx-auto px-6 py-8 flex flex-col items-center gap-5"
        style={{ maxWidth: "1400px" }}
      >
        {/* Social icons */}
        <div className="flex items-center gap-10">
          <a href="#" className="hover:opacity-80 transition-opacity">
            <img
              src="/assets/path_1.svg"
              alt="Facebook"
              className="h-7 sm:h-8 w-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity">
            <img
              src="/assets/group_77.svg"
              alt="YouTube"
              className="h-7 sm:h-8 w-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity">
            <img
              src="/assets/path_3.svg"
              alt="Instagram"
              className="h-7 sm:h-8 w-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </a>
        </div>

        {/* Copyright */}
        <p
          className="font-montserrat text-center text-xs sm:text-sm"
          style={{ color: "#ffffff" }}
        >
          © 2020 | algorythmics.com | About Us
        </p>
      </div>
    </footer>
  );
}
