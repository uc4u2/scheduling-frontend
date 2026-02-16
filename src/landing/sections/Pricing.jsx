import React from "react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$29",
    desc: "For small teams starting to automate",
    features: ["Team calendar", "Basic booking page", "Core payroll sync"],
  },
  {
    name: "Growth",
    price: "$79",
    desc: "For teams scaling operations",
    features: ["Advanced automations", "Role permissions", "Analytics dashboard"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For multi-location businesses",
    features: ["Dedicated onboarding", "Priority support", "Enterprise controls"],
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple pricing for every stage</h2>
          <p className="mt-3 text-slate-600">Start quickly and upgrade when your team and workflows expand.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-xl border p-7 ${plan.highlighted ? "border-sky-500 bg-sky-50 shadow-lg" : "border-slate-200 bg-white shadow-sm"}`}
              aria-label={`${plan.name} plan`}
            >
              {plan.highlighted && (
                <p className="mb-4 inline-flex rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Most Popular
                </p>
              )}
              <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{plan.desc}</p>
              <p className="mt-6 text-4xl font-bold text-slate-900">
                {plan.price}
                <span className="ml-1 text-base font-medium text-slate-500">{plan.price !== "Custom" ? "/mo" : ""}</span>
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.highlighted
                    ? "bg-sky-600 text-white hover:bg-sky-500 focus-visible:outline-sky-400"
                    : "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900"
                }`}
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
