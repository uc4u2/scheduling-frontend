import React, { useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../sections/Hero";
import Logos from "../sections/Logos";
import Features from "../sections/Features";
import Pricing from "../sections/Pricing";
import Testimonials from "../sections/Testimonials";
import FAQ from "../sections/FAQ";
import Footer from "../sections/Footer";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

const LandingPage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="text-lg font-bold tracking-tight text-slate-900" aria-label="Schedulaa home">
              Schedulaa
            </Link>

            <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Get Started
              </Link>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
              aria-label="Toggle navigation menu"
              aria-controls="landing-mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {mobileOpen && (
            <div id="landing-mobile-menu" className="border-t border-slate-200 py-4 md:hidden">
              <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="space-y-0">
        <Hero />
        <Logos />
        <Features />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
