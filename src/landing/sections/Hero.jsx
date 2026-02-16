import React from "react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-16 text-white md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.28),transparent_45%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.28),transparent_40%)]" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-semibold tracking-wider text-sky-200">
            SaaS Platform for Service Teams
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Grow faster with scheduling, payroll, and bookings in one place.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-200 sm:text-lg">
            Schedulaa gives operations teams one modern workspace to automate daily workflows, reduce manual errors,
            and improve client experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-lg bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-900/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <p className="text-sm font-semibold text-white">Product Preview</p>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-medium text-emerald-300">Live</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-slate-300">Bookings</p>
              <p className="mt-2 text-lg font-bold">+34%</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-slate-300">Payroll Accuracy</p>
              <p className="mt-2 text-lg font-bold">99.8%</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-slate-300">Time Saved</p>
              <p className="mt-2 text-lg font-bold">18 hrs/wk</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-end gap-2" aria-hidden="true">
              <span className="h-12 w-1/6 rounded bg-cyan-400/80" />
              <span className="h-16 w-1/6 rounded bg-cyan-300/80" />
              <span className="h-10 w-1/6 rounded bg-cyan-500/80" />
              <span className="h-20 w-1/6 rounded bg-indigo-400/80" />
              <span className="h-14 w-1/6 rounded bg-indigo-300/80" />
              <span className="h-24 w-1/6 rounded bg-sky-300/80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
