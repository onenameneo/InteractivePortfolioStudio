export interface Profile {
  name: string;
  role: string;
  headline: string;
  intro: string;
  about: string;
  location: string;
  email: string;
  availability: string;
  github: string;
  websiteUrl: string;
  resumeUrl: string;
  demo: boolean;
}
export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  role: string;
  stack: string;
  result: string;
  link: string;
  coverText?: string;
  coverUrl?: string;
  color: "sage" | "clay" | "blue";
}
export interface Experience {
  id: string;
  company: string;
  position: string;
  period: string;
  summary: string;
}
export interface Skill {
  id: string;
  title: string;
  items: string;
  description: string;
}
export interface Interest {
  id: string;
  title: string;
  description: string;
}
export interface Content {
  profile: Profile;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  interests: Interest[];
}
export async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("X-Requested-With", "NeoStudio");
  if (typeof FormData === "undefined" || !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  else headers.delete("Content-Type");
  const res = await fetch(path, {
    ...options,
    headers,
  });
  const value = await res.json();
  if (!res.ok)
    throw Object.assign(
      new Error([value.error, ...(value.details || [])].join("\n")),
      { status: res.status },
    );
  return value;
}
