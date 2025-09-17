import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Content, Category, TMDBMovie, TMDBResponse, Genre } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly TMDB_API_KEY = '4e44d9029b1270a757cddc766a1bcb63'; // Free demo key
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
  
  private searchQuery$ = new BehaviorSubject<string>('');
  private watchlist$ = new BehaviorSubject<Content[]>([]);
  private genres: Genre[] = [];

  constructor() {
    this.loadGenres();
  }

  private async loadGenres(): Promise<void> {
    try {
      const response = await fetch(`${this.TMDB_BASE_URL}/genre/movie/list?api_key=${this.TMDB_API_KEY}`);
      const data = await response.json();
      this.genres = data.genres || [];
    } catch (error) {
      console.error('Error loading genres:', error);
      this.genres = [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
        { id: 18, name: 'Drama' },
        { id: 27, name: 'Horror' },
        { id: 878, name: 'Science Fiction' },
        { id: 53, name: 'Thriller' },
        { id: 10749, name: 'Romance' }
      ];
    }
  }

  private convertTMDBToContent(tmdbMovie: TMDBMovie): Content {
    const movieGenres = tmdbMovie.genre_ids.map(id => {
      const genre = this.genres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    }).filter(name => name !== 'Unknown');

    return {
      id: tmdbMovie.id,
      title: tmdbMovie.title,
      description: tmdbMovie.overview || 'No description available.',
      thumbnail: tmdbMovie.poster_path 
        ? `${this.TMDB_IMAGE_BASE_URL}/w500${tmdbMovie.poster_path}`
        : 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=400',
      backdrop: tmdbMovie.backdrop_path 
        ? `${this.TMDB_IMAGE_BASE_URL}/w1280${tmdbMovie.backdrop_path}`
        : 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=1200',
      genre: movieGenres.length > 0 ? movieGenres : ['Drama'],
      rating: Math.round(tmdbMovie.vote_average * 10) / 10,
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 2023,
      duration: '120m', // TMDB doesn't provide runtime in discover endpoint
      type: 'movie' as const,
      trending: tmdbMovie.popularity > 100,
      featured: tmdbMovie.vote_average > 7.5,
      maturityRating: tmdbMovie.adult ? 'R' : 'PG-13',
      cast: ['Cast information not available'], // Would need additional API call
      director: 'Director information not available', // Would need additional API call
      releaseDate: tmdbMovie.release_date,
      originalTitle: tmdbMovie.original_title,
      popularity: tmdbMovie.popularity
    };
  }

  private async fetchMovies(endpoint: string): Promise<Content[]> {
    try {
      const response = await fetch(`${this.TMDB_BASE_URL}${endpoint}?api_key=${this.TMDB_API_KEY}&page=1`);
      const data: TMDBResponse = await response.json();
      return (data.results || []).map(movie => this.convertTMDBToContent(movie));
    } catch (error) {
      console.error('Error fetching movies:', error);
      return [];
    }
  }

  async getFeaturedContent(): Promise<Observable<Content>> {
    try {
      const movies = await this.fetchMovies('/movie/popular');
      const featured = movies.find(movie => movie.featured) || movies[0];
      return of(featured);
    } catch (error) {
      console.error('Error getting featured content:', error);
      return of(this.getFallbackContent());
    }
  }

  async getCategories(): Promise<Observable<Category[]>> {
    try {
      const [trending, popular, topRated, upcoming, action, comedy] = await Promise.all([
        this.fetchMovies('/trending/movie/week'),
        this.fetchMovies('/movie/popular'),
        this.fetchMovies('/movie/top_rated'),
        this.fetchMovies('/movie/upcoming'),
        this.fetchMovies('/discover/movie?with_genres=28'), // Action
        this.fetchMovies('/discover/movie?with_genres=35')  // Comedy
      ]);

      const categories: Category[] = [
        {
          id: 'trending',
          name: 'Trending Now',
          content: trending.slice(0, 20)
        },
        {
          id: 'popular',
          name: 'Popular Movies',
          content: popular.slice(0, 20)
        },
        {
          id: 'top-rated',
          name: 'Top Rated',
          content: topRated.slice(0, 20)
        },
        {
          id: 'upcoming',
          name: 'Coming Soon',
          content: upcoming.slice(0, 20)
        },
        {
          id: 'action',
          name: 'Action Movies',
          content: action.slice(0, 20)
        },
        {
          id: 'comedy',
          name: 'Comedy Movies',
          content: comedy.slice(0, 20)
        }
      ];

      return of(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      return of([]);
    }
  }

  async searchContent(query: string): Promise<Observable<Content[]>> {
    if (!query.trim()) {
      return of([]);
    }
    
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/search/movie?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
      );
      const data: TMDBResponse = await response.json();
      const results = data.results.map(movie => this.convertTMDBToContent(movie));
      return of(results);
    } catch (error) {
      console.error('Error searching content:', error);
      return of([]);
    }
  }

  getSearchQuery(): Observable<string> {
    return this.searchQuery$.asObservable();
  }

  setSearchQuery(query: string): void {
    this.searchQuery$.next(query);
  }

  getWatchlist(): Observable<Content[]> {
    return this.watchlist$.asObservable();
  }

  addToWatchlist(content: Content): void {
    const current = this.watchlist$.value;
    if (!current.find(c => c.id === content.id)) {
      this.watchlist$.next([...current, content]);
    }
  }

  removeFromWatchlist(contentId: number): void {
    const current = this.watchlist$.value;
    this.watchlist$.next(current.filter(c => c.id !== contentId));
  }

  isInWatchlist(contentId: number): boolean {
    return this.watchlist$.value.some(c => c.id === contentId);
  }

  private getFallbackContent(): Content {
    return {
      id: 1,
      title: 'Featured Movie',
      description: 'An amazing movie experience awaits you.',
      thumbnail: 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=400',
      backdrop: 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=1200',
      genre: ['Drama'],
      rating: 8.5,
      year: 2023,
      duration: '120m',
      type: 'movie',
      featured: true,
      maturityRating: 'PG-13',
      cast: ['Actor 1', 'Actor 2'],
      director: 'Director Name'
    };
  }
}