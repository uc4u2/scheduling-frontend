import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 py-14 text-slate-300">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="text-lg font-semibold text-white">Schedulaa</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Modern operating system for service businesses that want to scale without chaos.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/features" className="hover:text-white">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/demo" className="hover:text-white">Demo</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link to="/acceptable-use" className="hover:text-white">Acceptable Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} Schedulaa. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
