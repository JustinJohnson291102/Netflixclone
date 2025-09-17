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

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
  vote_average: number;
  first_air_date: string;
  original_name: string;
  popularity: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  release_date: string;
  runtime: number;
  adult: boolean;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  first_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
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