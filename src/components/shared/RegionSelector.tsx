"use client";

import React, { useEffect, useState } from "react";
import { useFranchise } from "@/shared/providers";
import { supabase } from "@/lib/supabase";
import { Database } from "@/../packages/types/supabase.types";
import { X } from "lucide-react";

// Franchise type from Supabase types
export type Franchise = Database["public"]["Tables"]["franchises"]["Row"];

export const RegionSelector: React.FC = () => {
  const { franchiseId, setFranchiseId, loading: franchiseLoading } = useFranchise();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFranchises = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("franchises")
        .select("*")
        .eq("is_active", true)
        .order("display_name", { ascending: true });
      if (error) {
        setError("Kan regio's niet laden.");
        setFranchises([]);
      } else {
        setFranchises(data || []);
      }
      setLoading(false);
    };
    fetchFranchises();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFranchiseId(e.target.value, "manual");
  };

  const handleClose = () => {
    // Set a default franchise or hide the modal
    if (franchises.length > 0) {
      setFranchiseId(franchises[0].id, "manual");
    }
  };

  if (loading || franchiseLoading) return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Regio's laden...</p>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-8">
      <div className="text-red-500 mb-4">{error}</div>
      <button 
        onClick={handleClose}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Sluiten
      </button>
    </div>
  );
  
  if (!franchises.length) return (
    <div className="text-center py-8">
      <div className="text-gray-600 mb-4">Geen regio's beschikbaar.</div>
      <button 
        onClick={handleClose}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Sluiten
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Kies jouw regio</h2>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-100 rounded"
          title="Sluiten"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <p className="text-gray-600 text-sm">
        Selecteer uw regio om de juiste diensten en professionals te zien.
      </p>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="region-select" className="font-medium text-gray-700">
          Regio/Franchise:
        </label>
        <select
          id="region-select"
          value={franchiseId || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="" disabled>Kies een regio...</option>
          {franchises.map((franchise) => (
            <option key={franchise.id} value={franchise.id}>
              {franchise.display_name} ({franchise.region})
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Geverifieerde professionals voor schoonmaak, tuinonderhoud, zorg en meer</span>
      </div>
      
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span>Vervoer en begeleiding</span>
      </div>
      
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <span>Technische hulp</span>
      </div>
    </div>
  );
};

export default RegionSelector; 