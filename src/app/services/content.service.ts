import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Content, Category, TMDBMovie, TMDBResponse, Genre, TMDBTVShow, TMDBMovieDetails, TMDBTVDetails } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // Replace with your TMDB API key
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
  
  private searchQuery$ = new BehaviorSubject<string>('');
  private watchlist$ = new BehaviorSubject<Content[]>([]);
  private currentPage$ = new BehaviorSubject<string>('home');
  private genres: Genre[] = [];
  private tvGenres: Genre[] = [];

  constructor() {
    this.loadGenres();
    this.loadTVGenres();
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

  private async loadTVGenres(): Promise<void> {
    try {
      const response = await fetch(`${this.TMDB_BASE_URL}/genre/tv/list?api_key=${this.TMDB_API_KEY}`);
      const data = await response.json();
      this.tvGenres = data.genres || [];
    } catch (error) {
      console.error('Error loading TV genres:', error);
      this.tvGenres = [
        { id: 10759, name: 'Action & Adventure' },
        { id: 35, name: 'Comedy' },
        { id: 18, name: 'Drama' },
        { id: 10765, name: 'Sci-Fi & Fantasy' },
        { id: 80, name: 'Crime' }
      ];
    }
  }

  private convertTMDBTVToContent(tmdbShow: TMDBTVShow): Content {
    const showGenres = tmdbShow.genre_ids.map(id => {
      const genre = this.tvGenres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    }).filter(name => name !== 'Unknown');

    return {
      id: tmdbShow.id,
      title: tmdbShow.name,
      description: tmdbShow.overview || 'No description available.',
      thumbnail: tmdbShow.poster_path 
        ? `${this.TMDB_IMAGE_BASE_URL}/w500${tmdbShow.poster_path}`
        : 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=400',
      backdrop: tmdbShow.backdrop_path 
        ? `${this.TMDB_IMAGE_BASE_URL}/w1280${tmdbShow.backdrop_path}`
        : 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=1200',
      genre: showGenres.length > 0 ? showGenres : ['Drama'],
      rating: Math.round(tmdbShow.vote_average * 10) / 10,
      year: tmdbShow.first_air_date ? new Date(tmdbShow.first_air_date).getFullYear() : 2023,
      duration: 'TV Series',
      type: 'series' as const,
      trending: tmdbShow.popularity > 50,
      featured: tmdbShow.vote_average > 7.0,
      maturityRating: 'TV-14',
      cast: ['Cast information not available'],
      director: 'Creator information not available',
      releaseDate: tmdbShow.first_air_date,
      originalTitle: tmdbShow.original_name,
      popularity: tmdbShow.popularity
    };
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

  private async fetchTVShows(endpoint: string): Promise<Content[]> {
    try {
      const response = await fetch(`${this.TMDB_BASE_URL}${endpoint}?api_key=${this.TMDB_API_KEY}&page=1`);
      const data = await response.json();
      return (data.results || []).map((show: TMDBTVShow) => this.convertTMDBTVToContent(show));
    } catch (error) {
      console.error('Error fetching TV shows:', error);
      return [];
    }
  }

  async getMovieDetails(movieId: number): Promise<Observable<Content>> {
    try {
      const [details, credits, videos] = await Promise.all([
        fetch(`${this.TMDB_BASE_URL}/movie/${movieId}?api_key=${this.TMDB_API_KEY}`),
        fetch(`${this.TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${this.TMDB_API_KEY}`),
        fetch(`${this.TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${this.TMDB_API_KEY}`)
      ]);

      const [detailsData, creditsData, videosData] = await Promise.all([
        details.json(),
        credits.json(),
        videos.json()
      ]);

      const content: Content = {
        id: detailsData.id,
        title: detailsData.title,
        description: detailsData.overview || 'No description available.',
        thumbnail: detailsData.poster_path 
          ? `${this.TMDB_IMAGE_BASE_URL}/w500${detailsData.poster_path}`
          : 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=400',
        backdrop: detailsData.backdrop_path 
          ? `${this.TMDB_IMAGE_BASE_URL}/w1280${detailsData.backdrop_path}`
          : 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=1200',
        videoUrl: videosData.results?.find((v: any) => v.type === 'Trailer')?.key 
          ? `https://www.youtube.com/watch?v=${videosData.results.find((v: any) => v.type === 'Trailer').key}`
          : undefined,
        trailerUrl: videosData.results?.find((v: any) => v.type === 'Trailer')?.key 
          ? `https://www.youtube.com/embed/${videosData.results.find((v: any) => v.type === 'Trailer').key}`
          : undefined,
        genre: detailsData.genres?.map((g: any) => g.name) || ['Drama'],
        rating: Math.round(detailsData.vote_average * 10) / 10,
        year: detailsData.release_date ? new Date(detailsData.release_date).getFullYear() : 2023,
        duration: detailsData.runtime ? `${detailsData.runtime}m` : '120m',
        type: 'movie',
        maturityRating: detailsData.adult ? 'R' : 'PG-13',
        cast: creditsData.cast?.slice(0, 10).map((c: any) => c.name) || ['Cast information not available'],
        director: creditsData.crew?.find((c: any) => c.job === 'Director')?.name || 'Director information not available',
        releaseDate: detailsData.release_date,
        originalTitle: detailsData.original_title,
        popularity: detailsData.popularity
      };

      return of(content);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return of(this.getFallbackContent());
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
      const [trending, popular, topRated, upcoming, action, comedy, tvPopular, tvTopRated] = await Promise.all([
        this.fetchMovies('/trending/movie/week'),
        this.fetchMovies('/movie/popular'),
        this.fetchMovies('/movie/top_rated'),
        this.fetchMovies('/movie/upcoming'),
        this.fetchMovies('/discover/movie?with_genres=28'), // Action
        this.fetchMovies('/discover/movie?with_genres=35'), // Comedy
        this.fetchTVShows('/tv/popular'),
        this.fetchTVShows('/tv/top_rated')
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
        },
        {
          id: 'tv-popular',
          name: 'Popular TV Shows',
          content: tvPopular.slice(0, 20)
        },
        {
          id: 'tv-top-rated',
          name: 'Top Rated TV Shows',
          content: tvTopRated.slice(0, 20)
        }
      ];

      return of(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      return of([]);
    }
  }

  async getMoviesOnly(): Promise<Observable<Category[]>> {
    try {
      const [popular, topRated, upcoming, action, comedy, horror, scifi] = await Promise.all([
        this.fetchMovies('/movie/popular'),
        this.fetchMovies('/movie/top_rated'),
        this.fetchMovies('/movie/upcoming'),
        this.fetchMovies('/discover/movie?with_genres=28'), // Action
        this.fetchMovies('/discover/movie?with_genres=35'), // Comedy
        this.fetchMovies('/discover/movie?with_genres=27'), // Horror
        this.fetchMovies('/discover/movie?with_genres=878') // Sci-Fi
      ]);

      const categories: Category[] = [
        {
          id: 'popular-movies',
          name: 'Popular Movies',
          content: popular.slice(0, 20)
        },
        {
          id: 'top-rated-movies',
          name: 'Top Rated Movies',
          content: topRated.slice(0, 20)
        },
        {
          id: 'upcoming-movies',
          name: 'Coming Soon',
          content: upcoming.slice(0, 20)
        },
        {
          id: 'action-movies',
          name: 'Action Movies',
          content: action.slice(0, 20)
        },
        {
          id: 'comedy-movies',
          name: 'Comedy Movies',
          content: comedy.slice(0, 20)
        },
        {
          id: 'horror-movies',
          name: 'Horror Movies',
          content: horror.slice(0, 20)
        },
        {
          id: 'scifi-movies',
          name: 'Sci-Fi Movies',
          content: scifi.slice(0, 20)
        }
      ];

      return of(categories);
    } catch (error) {
      console.error('Error getting movie categories:', error);
      return of([]);
    }
  }

  async getTVShowsOnly(): Promise<Observable<Category[]>> {
    try {
      const [popular, topRated, onAir, action, comedy, drama, scifi] = await Promise.all([
        this.fetchTVShows('/tv/popular'),
        this.fetchTVShows('/tv/top_rated'),
        this.fetchTVShows('/tv/on_the_air'),
        this.fetchTVShows('/discover/tv?with_genres=10759'), // Action & Adventure
        this.fetchTVShows('/discover/tv?with_genres=35'), // Comedy
        this.fetchTVShows('/discover/tv?with_genres=18'), // Drama
        this.fetchTVShows('/discover/tv?with_genres=10765') // Sci-Fi & Fantasy
      ]);

      const categories: Category[] = [
        {
          id: 'popular-tv',
          name: 'Popular TV Shows',
          content: popular.slice(0, 20)
        },
        {
          id: 'top-rated-tv',
          name: 'Top Rated TV Shows',
          content: topRated.slice(0, 20)
        },
        {
          id: 'on-air-tv',
          name: 'Currently Airing',
          content: onAir.slice(0, 20)
        },
        {
          id: 'action-tv',
          name: 'Action & Adventure',
          content: action.slice(0, 20)
        },
        {
          id: 'comedy-tv',
          name: 'Comedy Shows',
          content: comedy.slice(0, 20)
        },
        {
          id: 'drama-tv',
          name: 'Drama Series',
          content: drama.slice(0, 20)
        },
        {
          id: 'scifi-tv',
          name: 'Sci-Fi & Fantasy',
          content: scifi.slice(0, 20)
        }
      ];

      return of(categories);
    } catch (error) {
      console.error('Error getting TV show categories:', error);
      return of([]);
    }
  }

  async searchContent(query: string): Promise<Observable<Content[]>> {
    if (!query.trim()) {
      return of([]);
    }
    
    try {
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(`${this.TMDB_BASE_URL}/search/movie?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`),
        fetch(`${this.TMDB_BASE_URL}/search/tv?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`)
      ]);
      
      const [movieData, tvData] = await Promise.all([
        movieResponse.json(),
        tvResponse.json()
      ]);
      
      const movieResults = (movieData.results || []).map((movie: TMDBMovie) => this.convertTMDBToContent(movie));
      const tvResults = (tvData.results || []).map((show: TMDBTVShow) => this.convertTMDBTVToContent(show));
      
      const results = [...movieResults, ...tvResults];
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

  getCurrentPage(): Observable<string> {
    return this.currentPage$.asObservable();
  }

  setCurrentPage(page: string): void {
    this.currentPage$.next(page);
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