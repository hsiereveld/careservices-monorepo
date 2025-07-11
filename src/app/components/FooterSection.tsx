"use client";
import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="bg-secondary-500 text-white py-8 px-4 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm">&copy; {new Date().getFullYear()} Care & Service Pinoso</div>
        <div className="flex gap-4 text-sm">
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Voorwaarden</Link>
        </div>
      </div>
    </footer>
  );
} 