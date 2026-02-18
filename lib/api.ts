import { supabase } from "@/lib/supabase";
import { Category, City, Place } from "@/types";

export async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase.from("cities").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as City[];
}

export async function fetchPlaces(cityId: string, categories: Category[]): Promise<Place[]> {
  let query = supabase.from("places").select("*").eq("city_id", cityId).eq("status", "published");
  if (categories.length) query = query.in("category", categories);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Place[];
}
