import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Content, Category, TMDBMovie, TMDBResponse, Genre, TMDBTVShow, TMDBMovieDetails, TMDBTVDetails } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  // TMDb API - Free API with 1000 requests per day
  private readonly TMDB_API_KEY = '8f59c2cc43c6470db6973d769369769'; // This is a demo key, replace with your own
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
  
  // OMDb API - Free with 1000 requests per day
  private readonly OMDB_API_KEY = 'trilogy'; // Free demo key, replace with your own
  private readonly OMDB_BASE_URL = 'https://www.omdbapi.com';
  
  // YouTube API for trailers (optional, using embedded videos)
  private readonly YOUTUBE_API_KEY = 'demo_key'; // Replace with your YouTube API key
  
  private searchQuery$ = new BehaviorSubject<string>('');
  private watchlist$ = new BehaviorSubject<Content[]>([]);
  private currentPage$ = new BehaviorSubject<string>('home');
  private genres: Genre[] = [];
  private tvGenres: Genre[] = [];
  private allContent: Content[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeGenres();
  }

  private initializeGenres(): void {
    this.genres = [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
      { id: 18, name: 'Drama' },
      { id: 27, name: 'Horror' },
      { id: 878, name: 'Science Fiction' },
      { id: 53, name: 'Thriller' },
      { id: 10749, name: 'Romance' },
      { id: 16, name: 'Animation' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 14, name: 'Fantasy' },
      { id: 36, name: 'History' },
      { id: 10402, name: 'Music' },
      { id: 9648, name: 'Mystery' },
      { id: 10770, name: 'TV Movie' },
      { id: 10752, name: 'War' },
      { id: 37, name: 'Western' }
    ];
    
    this.tvGenres = [
      { id: 10759, name: 'Action & Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 18, name: 'Drama' },
      { id: 10751, name: 'Family' },
      { id: 10762, name: 'Kids' },
      { id: 9648, name: 'Mystery' },
      { id: 10763, name: 'News' },
      { id: 10764, name: 'Reality' },
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 10766, name: 'Soap' },
      { id: 10767, name: 'Talk' },
      { id: 10768, name: 'War & Politics' },
      { id: 37, name: 'Western' }
    ];
  }

  private async initializeContent(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing content from APIs...');
      
      // Fetch content from multiple sources
      const [popularMovies, topRatedMovies, trendingMovies, popularTVShows] = await Promise.all([
        this.fetchTMDbPopularMovies(),
        this.fetchTMDbTopRatedMovies(),
        this.fetchTMDbTrendingMovies(),
        this.fetchTMDbPopularTVShows()
      ]);

      this.allContent = [
        ...popularMovies,
        ...topRatedMovies,
        ...trendingMovies,
        ...popularTVShows
      ];

      // Remove duplicates based on title
      this.allContent = this.allContent.filter((content, index, self) => 
        index === self.findIndex(c => c.title === content.title)
      );

      console.log(`Loaded ${this.allContent.length} content items`);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing content:', error);
      this.allContent = this.getFallbackMovies();
      this.isInitialized = true;
    }
  }

  private async fetchTMDbPopularMovies(): Promise<Content[]> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/movie/popular?api_key=${this.TMDB_API_KEY}&language=en-US&page=1`
      );
      
      if (!response.ok) {
        throw new Error(`TMDb API error: ${response.status}`);
      }
      
      const data: TMDBResponse = await response.json();
      
      const movies = await Promise.all(
        data.results.slice(0, 20).map(async (movie) => {
          const details = await this.fetchTMDbMovieDetails(movie.id);
          const trailerUrl = await this.fetchMovieTrailer(movie.id);
          return this.convertTMDbMovieToContent(movie, details, trailerUrl);
        })
      );
      
      return movies.filter(movie => movie !== null);
    } catch (error) {
      console.error('Error fetching popular movies from TMDb:', error);
      return [];
    }
  }

  private async fetchTMDbTopRatedMovies(): Promise<Content[]> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/movie/top_rated?api_key=${this.TMDB_API_KEY}&language=en-US&page=1`
      );
      
      if (!response.ok) {
        throw new Error(`TMDb API error: ${response.status}`);
      }
      
      const data: TMDBResponse = await response.json();
      
      const movies = await Promise.all(
        data.results.slice(0, 20).map(async (movie) => {
          const details = await this.fetchTMDbMovieDetails(movie.id);
          const trailerUrl = await this.fetchMovieTrailer(movie.id);
          return this.convertTMDbMovieToContent(movie, details, trailerUrl);
        })
      );
      
      return movies.filter(movie => movie !== null);
    } catch (error) {
      console.error('Error fetching top rated movies from TMDb:', error);
      return [];
    }
  }

  private async fetchTMDbTrendingMovies(): Promise<Content[]> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/trending/movie/week?api_key=${this.TMDB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`TMDb API error: ${response.status}`);
      }
      
      const data: TMDBResponse = await response.json();
      
      const movies = await Promise.all(
        data.results.slice(0, 20).map(async (movie) => {
          const details = await this.fetchTMDbMovieDetails(movie.id);
          const trailerUrl = await this.fetchMovieTrailer(movie.id);
          return this.convertTMDbMovieToContent(movie, details, trailerUrl);
        })
      );
      
      return movies.filter(movie => movie !== null);
    } catch (error) {
      console.error('Error fetching trending movies from TMDb:', error);
      return [];
    }
  }

  private async fetchTMDbPopularTVShows(): Promise<Content[]> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/tv/popular?api_key=${this.TMDB_API_KEY}&language=en-US&page=1`
      );
      
      if (!response.ok) {
        throw new Error(`TMDb API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const shows = await Promise.all(
        data.results.slice(0, 15).map(async (show: TMDBTVShow) => {
          const details = await this.fetchTMDbTVDetails(show.id);
          const trailerUrl = await this.fetchTVTrailer(show.id);
          return this.convertTMDbTVToContent(show, details, trailerUrl);
        })
      );
      
      return shows.filter(show => show !== null);
    } catch (error) {
      console.error('Error fetching popular TV shows from TMDb:', error);
      return [];
    }
  }

  private async fetchTMDbMovieDetails(movieId: number): Promise<TMDBMovieDetails | null> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/movie/${movieId}?api_key=${this.TMDB_API_KEY}&language=en-US&append_to_response=credits`
      );
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching movie details for ${movieId}:`, error);
      return null;
    }
  }

  private async fetchTMDbTVDetails(tvId: number): Promise<TMDBTVDetails | null> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/tv/${tvId}?api_key=${this.TMDB_API_KEY}&language=en-US&append_to_response=credits`
      );
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching TV details for ${tvId}:`, error);
      return null;
    }
  }

  private async fetchMovieTrailer(movieId: number): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${this.TMDB_API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const trailer = data.results.find((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
      console.error(`Error fetching trailer for movie ${movieId}:`, error);
      return null;
    }
  }

  private async fetchTVTrailer(tvId: number): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/tv/${tvId}/videos?api_key=${this.TMDB_API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const trailer = data.results.find((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
      console.error(`Error fetching trailer for TV show ${tvId}:`, error);
      return null;
    }
  }

  private convertTMDbMovieToContent(movie: TMDBMovie, details: TMDBMovieDetails | null, trailerUrl: string | null): Content | null {
    if (!movie) return null;

    const genres = details?.genres?.map(g => g.name) || 
                  movie.genre_ids.map(id => this.genres.find(g => g.id === id)?.name).filter(Boolean) as string[];

    const cast = (details as any)?.credits?.cast?.slice(0, 5).map((actor: any) => actor.name) || [];
    const director = (details as any)?.credits?.crew?.find((person: any) => person.job === 'Director')?.name || 'Unknown Director';

    return {
      id: movie.id,
      title: movie.title,
      description: movie.overview || 'No description available.',
      thumbnail: movie.poster_path ? `${this.TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : this.getPlaceholderImage(),
      backdrop: movie.backdrop_path ? `${this.TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : this.getPlaceholderImage(),
      videoUrl: trailerUrl || undefined,
      trailerUrl: trailerUrl || undefined,
      genre: genres.length > 0 ? genres : ['Drama'],
      rating: Math.round(movie.vote_average * 10) / 10,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 2023,
      duration: details?.runtime ? `${details.runtime} min` : '120 min',
      type: 'movie',
      trending: movie.popularity > 100,
      featured: movie.vote_average > 8.0,
      maturityRating: movie.adult ? 'R' : 'PG-13',
      cast: cast.length > 0 ? cast : ['Cast information not available'],
      director: director,
      releaseDate: movie.release_date,
      originalTitle: movie.original_title,
      popularity: movie.popularity
    };
  }

  private convertTMDbTVToContent(show: TMDBTVShow, details: TMDBTVDetails | null, trailerUrl: string | null): Content | null {
    if (!show) return null;

    const genres = details?.genres?.map(g => g.name) || 
                  show.genre_ids.map(id => this.tvGenres.find(g => g.id === id)?.name).filter(Boolean) as string[];

    const cast = (details as any)?.credits?.cast?.slice(0, 5).map((actor: any) => actor.name) || [];
    const creator = (details as any)?.created_by?.[0]?.name || 'Unknown Creator';

    return {
      id: show.id + 100000, // Offset to avoid conflicts with movies
      title: show.name,
      description: show.overview || 'No description available.',
      thumbnail: show.poster_path ? `${this.TMDB_IMAGE_BASE_URL}/w500${show.poster_path}` : this.getPlaceholderImage(),
      backdrop: show.backdrop_path ? `${this.TMDB_IMAGE_BASE_URL}/w1280${show.backdrop_path}` : this.getPlaceholderImage(),
      videoUrl: trailerUrl || undefined,
      trailerUrl: trailerUrl || undefined,
      genre: genres.length > 0 ? genres : ['Drama'],
      rating: Math.round(show.vote_average * 10) / 10,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 2023,
      duration: details ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}` : '1 Season',
      type: 'series',
      trending: show.popularity > 50,
      featured: show.vote_average > 8.0,
      maturityRating: 'TV-14',
      cast: cast.length > 0 ? cast : ['Cast information not available'],
      director: creator,
      releaseDate: show.first_air_date,
      originalTitle: show.original_name,
      popularity: show.popularity
    };
  }

  private getPlaceholderImage(): string {
    const placeholders = [
      'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/7991664/pexels-photo-7991664.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/8111357/pexels-photo-8111357.jpeg?auto=compress&cs=tinysrgb&w=500'
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  async getMovieDetails(movieId: number): Promise<Observable<Content>> {
    try {
      await this.initializeContent();
      const content = this.allContent.find(c => c.id === movieId);
      if (content) {
        return of(content);
      }
      
      // If not found locally, try to fetch from API
      const details = await this.fetchTMDbMovieDetails(movieId);
      if (details) {
        const trailerUrl = await this.fetchMovieTrailer(movieId);
        const movie = {
          id: details.id,
          title: details.title,
          overview: details.overview,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          genre_ids: details.genres.map(g => g.id),
          vote_average: details.vote_average,
          release_date: details.release_date,
          original_title: details.title,
          popularity: 0,
          adult: details.adult
        } as TMDBMovie;
        
        const content = this.convertTMDbMovieToContent(movie, details, trailerUrl);
        return of(content || this.getFallbackContent());
      }
      
      return of(this.getFallbackContent());
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return of(this.getFallbackContent());
    }
  }

  async getFeaturedContent(): Promise<Observable<Content>> {
    try {
      await this.initializeContent();
      const featured = this.allContent.find(content => content.featured) || 
                      this.allContent.find(content => content.rating > 8.0) ||
                      this.allContent[0] || 
                      this.getFallbackContent();
      return of(featured);
    } catch (error) {
      console.error('Error getting featured content:', error);
      return of(this.getFallbackContent());
    }
  }

  async getCategories(): Promise<Observable<Category[]>> {
    try {
      await this.initializeContent();
      
      const categories: Category[] = [
        {
          id: 'trending',
          name: 'Trending Now',
          content: this.allContent.filter(c => c.trending).slice(0, 20)
        },
        {
          id: 'popular',
          name: 'Popular on StreamFlix',
          content: this.allContent.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)
        },
        {
          id: 'top-rated',
          name: 'Top Rated',
          content: this.allContent.sort((a, b) => b.rating - a.rating).slice(0, 20)
        },
        {
          id: 'action',
          name: 'Action & Adventure',
          content: this.allContent.filter(c => c.genre.some(g => g.toLowerCase().includes('action'))).slice(0, 20)
        },
        {
          id: 'comedy',
          name: 'Comedy Movies & Shows',
          content: this.allContent.filter(c => c.genre.some(g => g.toLowerCase().includes('comedy'))).slice(0, 20)
        },
        {
          id: 'drama',
          name: 'Drama',
          content: this.allContent.filter(c => c.genre.some(g => g.toLowerCase().includes('drama'))).slice(0, 20)
        },
        {
          id: 'sci-fi',
          name: 'Sci-Fi & Fantasy',
          content: this.allContent.filter(c => c.genre.some(g => 
            g.toLowerCase().includes('science') || 
            g.toLowerCase().includes('fantasy') || 
            g.toLowerCase().includes('sci-fi')
          )).slice(0, 20)
        }
      ];

      // Filter out empty categories
      return of(categories.filter(cat => cat.content.length > 0));
    } catch (error) {
      console.error('Error getting categories:', error);
      return of([]);
    }
  }

  async getMoviesOnly(): Promise<Observable<Category[]>> {
    try {
      await this.initializeContent();
      const movies = this.allContent.filter(c => c.type === 'movie');
      
      const categories: Category[] = [
        {
          id: 'popular-movies',
          name: 'Popular Movies',
          content: movies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)
        },
        {
          id: 'top-rated-movies',
          name: 'Top Rated Movies',
          content: movies.sort((a, b) => b.rating - a.rating).slice(0, 20)
        },
        {
          id: 'action-movies',
          name: 'Action Movies',
          content: movies.filter(c => c.genre.some(g => g.toLowerCase().includes('action'))).slice(0, 20)
        },
        {
          id: 'comedy-movies',
          name: 'Comedy Movies',
          content: movies.filter(c => c.genre.some(g => g.toLowerCase().includes('comedy'))).slice(0, 20)
        },
        {
          id: 'drama-movies',
          name: 'Drama Movies',
          content: movies.filter(c => c.genre.some(g => g.toLowerCase().includes('drama'))).slice(0, 20)
        },
        {
          id: 'horror-movies',
          name: 'Horror Movies',
          content: movies.filter(c => c.genre.some(g => g.toLowerCase().includes('horror'))).slice(0, 20)
        }
      ];

      return of(categories.filter(cat => cat.content.length > 0));
    } catch (error) {
      console.error('Error getting movie categories:', error);
      return of([]);
    }
  }

  async getTVShowsOnly(): Promise<Observable<Category[]>> {
    try {
      await this.initializeContent();
      const tvShows = this.allContent.filter(c => c.type === 'series');
      
      const categories: Category[] = [
        {
          id: 'popular-tv',
          name: 'Popular TV Shows',
          content: tvShows.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)
        },
        {
          id: 'top-rated-tv',
          name: 'Top Rated TV Shows',
          content: tvShows.sort((a, b) => b.rating - a.rating).slice(0, 20)
        },
        {
          id: 'action-tv',
          name: 'Action & Adventure',
          content: tvShows.filter(c => c.genre.some(g => g.toLowerCase().includes('action'))).slice(0, 20)
        },
        {
          id: 'comedy-tv',
          name: 'Comedy Shows',
          content: tvShows.filter(c => c.genre.some(g => g.toLowerCase().includes('comedy'))).slice(0, 20)
        },
        {
          id: 'drama-tv',
          name: 'Drama Series',
          content: tvShows.filter(c => c.genre.some(g => g.toLowerCase().includes('drama'))).slice(0, 20)
        }
      ];

      return of(categories.filter(cat => cat.content.length > 0));
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
      // Search TMDb API
      const [movieResults, tvResults] = await Promise.all([
        this.searchTMDbMovies(query),
        this.searchTMDbTVShows(query)
      ]);
      
      const allResults = [...movieResults, ...tvResults];
      
      // Also search local content
      const localResults = this.allContent.filter(content => 
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
      );
      
      // Combine and deduplicate results
      const combinedResults = [...allResults, ...localResults];
      const uniqueResults = combinedResults.filter((content, index, self) => 
        index === self.findIndex(c => c.title === content.title)
      );
      
      return of(uniqueResults.slice(0, 20));
    } catch (error) {
      console.error('Error searching content:', error);
      
      // Fallback to local search
      const localResults = this.allContent.filter(content => 
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
      );
      
      return of(localResults.slice(0, 20));
    }
  }

  private async searchTMDbMovies(query: string): Promise<Content[]> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/search/movie?api_key=${this.TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`
      );
      
      if (!response.ok) {
        return [];
      }
      
      const data: TMDBResponse = await response.json();
      
      const movies = await Promise.all(
        data.results.slice(0, 10).map(async (movie) => {
          const details = await this.fetchTMDbMovieDetails(movie.id);
          const trailerUrl = await this.fetchMovieTrailer(movie.id);
          return this.convertTMDbMovieToContent(movie, details, trailerUrl);
        })
      );
      
      return movies.filter(movie => movie !== null);
    } catch (error) {
      console.error('Error searching TMDb movies:', error);
      return [];
    }
  }

  private async searchTMDbTVShows(query: string): Promise<Content[]> {
    try {
      const response = await fetch(
        `${this.TMDB_BASE_URL}/search/tv?api_key=${this.TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`
      );
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      
      const shows = await Promise.all(
        data.results.slice(0, 10).map(async (show: TMDBTVShow) => {
          const details = await this.fetchTMDbTVDetails(show.id);
          const trailerUrl = await this.fetchTVTrailer(show.id);
          return this.convertTMDbTVToContent(show, details, trailerUrl);
        })
      );
      
      return shows.filter(show => show !== null);
    } catch (error) {
      console.error('Error searching TMDb TV shows:', error);
      return [];
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

  private getFallbackMovies(): Content[] {
    return [
      {
        id: 1,
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
        thumbnail: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdrop: 'https://image.tmdb.org/t/p/w1280/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
        genre: ['Action', 'Crime', 'Drama'],
        rating: 9.0,
        year: 2008,
        duration: '152 min',
        type: 'movie',
        featured: true,
        trending: true,
        maturityRating: 'PG-13',
        cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
        director: 'Christopher Nolan',
        trailerUrl: 'https://www.youtube.com/embed/EXeTwQWrcwY',
        popularity: 95
      }
    ];
  }

  private getFallbackContent(): Content {
    return this.getFallbackMovies()[0];
  }
}