export interface Content {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  videoUrl?: string;
  trailerUrl?: string;
  genre: string[];
  rating: number;
  year: number;
  duration: string;
  type: 'movie' | 'series';
  trending?: boolean;
  featured?: boolean;
  maturityRating: string;
  cast: string[];
  director: string;
  releaseDate?: string;
  originalTitle?: string;
  popularity?: number;
}

export interface Category {
  id: string;
  name: string;
  content: Content[];
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
  vote_average: number;
  release_date: string;
  original_title: string;
  popularity: number;
  adult: boolean;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}