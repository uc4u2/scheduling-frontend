import React, { useState } from "react";

const items = [
  {
    q: "Can I use Schedulaa across multiple locations?",
    a: "Yes. You can manage multiple branches with centralized controls and role-based access.",
  },
  {
    q: "Does it support online booking and checkout?",
    a: "Yes. You can publish pages with integrated booking and payment collection.",
  },
  {
    q: "Can we migrate from existing tools?",
    a: "Yes. Most teams migrate gradually, starting with scheduling and then payroll workflows.",
  },
  {
    q: "Is there onboarding support?",
    a: "Yes. Growth and Enterprise plans include guided onboarding and implementation support.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Frequently asked questions</h2>
          <p className="mt-3 text-slate-600">Answers to common questions before teams go live.</p>
        </div>

        <div className="mt-10 space-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article key={item.q} className="rounded-xl border border-slate-200 bg-slate-50/50">
                <h3>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
                  >
                    <span className="text-sm font-semibold text-slate-900 sm:text-base">{item.q}</span>
                    <span className="text-slate-500" aria-hidden="true">{isOpen ? "-" : "+"}</span>
                  </button>
                </h3>
                {isOpen && <p className="px-5 pb-5 text-sm leading-6 text-slate-600">{item.a}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
