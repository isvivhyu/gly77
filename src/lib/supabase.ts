import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface School {
  id?: number;
  school: string;
  min_tuition: string;
  max_tuition: string;
  class_size: string;
  curriculum: string;
  schedule: string;
  programs: string;
  care: string;
  support: string;
  logo_banner: string;
  website: string;
  facebook: string;
  number: string;
  email: string;
  city: string;
  curriculum_tags: string;
  created_at?: string;
  updated_at?: string;
  location?: string;
  summary?: string;
}

export interface City {
  id?: number;
  city: string;
  school_count?: number;
  created_at?: string;
  updated_at?: string;
}
