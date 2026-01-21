// src/types.ts

// ✅ Invoice type
export interface Invoice {
  amount: string;      // Amount in Naira (or any currency)
  paid: boolean;       // Paid status
}

// ✅ Customer type
export interface Customer {
  id?: string;         // Firestore document ID (optional, added after saving)
  name: string;        // Customer full name
  measurements: string; // Measurements (e.g., "Bust: 34, Waist: 28, Hip: 36")
  outfitName: string;   // Name of the outfit
  fabric: string;       // Fabric type (e.g., "Lace", "Silk")
  date: string;         // Date of outfit creation / measurement
  images?: string[];    // Array of image URLs from Firebase Storage
  invoice?: Invoice;    // Invoice details
}
