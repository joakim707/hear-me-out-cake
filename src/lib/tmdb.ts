const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export type TmdbPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  known_for?: Array<{
    title?: string;
    name?: string;
    media_type?: string;
  }>;
};

export async function searchTmdbPeople(query: string): Promise<
  { name: string; img: string | null; knownFor?: string }[]
> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("VITE_TMDB_API_KEY manquant (clé TMDB).");
  }

  if (!query.trim()) return [];

  const url = `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(
    query.trim()
  )}&include_adult=false`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("TMDB search error", res.status, await res.text());
    throw new Error("Erreur TMDB");
  }

  const json = await res.json();
  const people = (json.results ?? []) as TmdbPerson[];

  return people.map((p) => {
    const img = tmdbImageUrl(p.profile_path);
    const firstKnown = p.known_for?.[0];
    const knownFor =
      firstKnown?.title ??
      firstKnown?.name ??
      p.known_for_department ??
      undefined;

    return {
      name: p.name,
      img,
      knownFor,
    };
  });
}

export function tmdbImageUrl(profilePath: string | null): string | null {
  if (!profilePath) return null;
  return `${TMDB_IMAGE_BASE}${profilePath}`;
}

