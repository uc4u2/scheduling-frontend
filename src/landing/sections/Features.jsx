import React from "react";

const features = [
  {
    title: "Unified scheduling",
    body: "Manage shifts, appointments, and team availability from one smart calendar.",
    icon: "calendar",
  },
  {
    title: "Payroll automation",
    body: "Turn approved time entries into payroll-ready records with fewer manual corrections.",
    icon: "cash",
  },
  {
    title: "Booking website",
    body: "Publish high-converting pages with integrated booking and checkout flows.",
    icon: "rocket",
  },
  {
    title: "Team productivity",
    body: "Track performance and workload across roles, departments, and locations.",
    icon: "chart",
  },
  {
    title: "Customer lifecycle",
    body: "Follow leads to repeat bookings with centralized profile and activity history.",
    icon: "users",
  },
  {
    title: "Enterprise controls",
    body: "Role-based permissions, audit trails, and secure operations at scale.",
    icon: "shield",
  },
];

const iconMap = {
  calendar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M12 9v6M9.5 10.5c.2-.9 1-1.5 2-1.5h1c1.1 0 2 .9 2 2s-.9 2-2 2h-1c-1 0-1.8.7-2 1.5" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 15c0-4.4 3.6-8 8-8h6v6c0 4.4-3.6 8-8 8H5v-6z" />
      <path d="M9 19l-4 4M9 15l-6 6" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 19V5M20 19H4" />
      <path d="M7 15l3-3 3 2 4-5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M17 11c1.7 0 3 1.3 3 3M20 19c0-2.2-1.8-4-4-4" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l7 3v6c0 5-3.5 8.6-7 10-3.5-1.4-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
};

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to run operations</h2>
          <p className="mt-3 text-slate-600">Modular tools that work together across scheduling, bookings, team management, and payroll.</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="inline-flex rounded-lg bg-sky-100 p-2 text-sky-700">{iconMap[feature.icon]}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
