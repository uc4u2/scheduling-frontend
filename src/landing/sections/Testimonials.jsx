import React from "react";

const testimonials = [
  {
    quote: "We replaced three disconnected tools and finally got one reliable workflow for operations.",
    name: "Mia Chen",
    role: "Operations Manager",
  },
  {
    quote: "Launching our booking site and payroll sync took days, not months.",
    name: "Avery Patel",
    role: "Studio Owner",
  },
  {
    quote: "The team adopted it quickly, and support has been solid since day one.",
    name: "Jordan Reyes",
    role: "General Manager",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Trusted by teams who execute fast</h2>
          <p className="mt-3 text-slate-600">Real outcomes from service businesses using Schedulaa daily.</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm leading-7 text-slate-700">“{item.quote}”</p>
              <footer className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
