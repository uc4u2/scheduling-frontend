import React from "react";

const logos = ["Northline", "Studio Bloom", "Urban Glow", "Recruitly", "PrimeOps", "MotionLab"];

const Logos = () => {
  return (
    <section aria-label="Trusted by teams" className="border-y border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Trusted by modern service businesses
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" role="list">
          {logos.map((logo) => (
            <li
              key={logo}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600"
            >
              {logo}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Logos;
