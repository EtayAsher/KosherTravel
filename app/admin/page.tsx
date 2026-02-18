"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Category, City, Place } from "@/types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AdminMapPicker = dynamic(() => import("@/components/admin-map-picker").then((m) => m.AdminMapPicker), { ssr: false });

const emptyForm = {
  city_id: "",
  name: "",
  category: "chabad" as Category,
  address: "",
  phone: "",
  website: "",
  lat: "",
  lng: "",
  is_verified: false,
  is_featured: false,
  featured_rank: "",
  status: "published"
};

export default function AdminPage() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const { data: cityData } = await supabase.from("cities").select("*").order("name");
    const { data: placeData } = await supabase.from("places").select("*").order("updated_at", { ascending: false }).limit(200);
    setCities((cityData ?? []) as City[]);
    setPlaces((placeData ?? []) as Place[]);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/admin/login");
      else load();
    });
  }, [router]);

  async function savePlace() {
    const payload = {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      featured_rank: form.featured_rank ? Number(form.featured_rank) : null
    };
    const res = editingId
      ? await supabase.from("places").update(payload).eq("id", editingId)
      : await supabase.from("places").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? "Place updated" : "Place created");
    setForm(emptyForm);
    setEditingId(null);
    load();
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Button onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }}>Logout</Button>
      </div>
      <section className="grid gap-4 md:grid-cols-[380px_1fr]">
        <div className="glass rounded-2xl p-4">
          <h2 className="mb-3 font-medium">{editingId ? "Edit Place" : "Add Place"}</h2>
          <div className="space-y-2">
            <select className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2" value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
              <option value="">City</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
              <option value="chabad">Chabad House</option><option value="restaurant">Kosher Restaurant</option><option value="grocery">Kosher Grocery</option><option value="mikveh">Mikveh</option>
            </select>
            <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              <Input placeholder="Lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </div>
            <AdminMapPicker
              city={cities.find((c) => c.id === form.city_id) || null}
              lat={Number(form.lat || 0)}
              lng={Number(form.lng || 0)}
              onPick={(lat, lng) => setForm({ ...form, lat: String(lat), lng: String(lng) })}
            />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_verified} onChange={(e) => setForm({ ...form, is_verified: e.target.checked })} /> Verified</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
            <Input placeholder="Featured rank" value={form.featured_rank} onChange={(e) => setForm({ ...form, featured_rank: e.target.value })} />
            <select className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">draft</option><option value="published">published</option><option value="hidden">hidden</option>
            </select>
            <Button className="w-full bg-gold/70 text-black" onClick={savePlace}>Save</Button>
          </div>
        </div>
        <div className="space-y-3">
          {places.map((p) => (
            <div key={p.id} className="glass flex items-center justify-between rounded-xl p-3">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-white/70">{p.status} · {p.category} · {p.address}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setEditingId(p.id); setForm({ ...p, lat: String(p.lat), lng: String(p.lng), featured_rank: p.featured_rank?.toString() ?? "", phone: p.phone ?? "", website: p.website ?? "" }); }}>Edit</Button>
                <Button onClick={async () => { const { error } = await supabase.from("places").delete().eq("id", p.id); if (error) toast.error(error.message); else load(); }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
