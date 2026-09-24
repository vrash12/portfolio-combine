export type BlogImage = {
  id: number;
  blog_id: number;
  image: string;
  caption?: string | null;
  created_at?: string;
};

export type BlogVideo = {
  id: number;
  blog_id: number;
  video: string;
  caption?: string | null;
  created_at?: string;
};

export type BlogPost = {
  id: number;
  title: string;
  description: string;
  body: string;
  image?: string | null;
  images?: BlogImage[];
  videos?: BlogVideo[];
  tags?: string | null;
  category?: string | null;
  location?: string | null;
  adventure_date?: string | null;
  published?: number;
  created_at: string;
  updated_at?: string;
};

export type ProjectImage = {
  id: number;
  project_id: number;
  image: string;
  caption?: string | null;
  created_at?: string;
};

export type ProjectVideo = {
  id: number;
  project_id: number;
  video: string;
  caption?: string | null;
  created_at?: string;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  image?: string | null;
  images?: ProjectImage[];
  video?: string | null;
  videos?: ProjectVideo[];
  category: string;
  technologies?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  featured?: number;
  published?: number;
  created_at?: string;
  updated_at?: string;
};
