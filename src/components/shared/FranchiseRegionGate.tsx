"use client";
import { useFranchise } from "@/shared/providers";
import RegionSelector from "./RegionSelector";

export default function FranchiseRegionGate({ children }: { children: React.ReactNode }) {
  const { needsManualSelection } = useFranchise();
  return (
    <>
      {needsManualSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px]">
            <RegionSelector />
          </div>
        </div>
      )}
      {children}
    </>
  );
} 