export type Category = "chabad" | "restaurant" | "grocery" | "mikveh";

export type City = {
  id: string;
  name: string;
  country: string | null;
  center_lat: number;
  center_lng: number;
  default_zoom: number;
};

export type Place = {
  id: string;
  city_id: string;
  name: string;
  category: Category;
  address: string;
  phone: string | null;
  website: string | null;
  lat: number;
  lng: number;
  is_verified: boolean;
  is_featured: boolean;
  featured_rank: number | null;
  status: "draft" | "published" | "hidden";
};
