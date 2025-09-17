import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Content, Category, TMDBMovie, TMDBResponse, Genre, TMDBTVShow, TMDBMovieDetails, TMDBTVDetails } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly TMDB_API_KEY = ''; // We'll use a different approach
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
  
  // Using OMDb API as fallback (free, no key required for basic usage)
  private readonly OMDB_BASE_URL = 'https://www.omdbapi.com';
  
  // Using a free movie database API
  private readonly FREE_API_BASE_URL = 'https://api.tvmaze.com';
  
  private searchQuery$ = new BehaviorSubject<string>('');
  private watchlist$ = new BehaviorSubject<Content[]>([]);
  private currentPage$ = new BehaviorSubject<string>('home');
  private genres: Genre[] = [];
  private tvGenres: Genre[] = [];

  constructor() {
    // Initialize with fallback data
    this.initializeFallbackData();
  }

  private initializeFallbackData(): void {
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
      { id: 99, name: 'Documentary' }
    ];
    
    this.tvGenres = [
      { id: 10759, name: 'Action & Adventure' },
      { id: 35, name: 'Comedy' },
      { id: 18, name: 'Drama' },
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 10751, name: 'Family' },
      { id: 10762, name: 'Kids' }
    ];
  }

  // Fetch movies from a free API source
  private async fetchFreeMovies(): Promise<Content[]> {
    try {
      // Using TVMaze API for shows, but we'll create movie-like content
      const response = await fetch(`${this.FREE_API_BASE_URL}/shows`);
      const data = await response.json();
      
      return data.slice(0, 100).map((show: any, index: number) => this.convertTVMazeToContent(show, index));
    } catch (error) {
      console.error('Error fetching free movies:', error);
      return this.getFallbackMovies();
    }
  }

  private convertTVMazeToContent(show: any, index: number): Content {
    const genres = show.genres && show.genres.length > 0 ? show.genres : ['Drama'];
    const rating = show.rating?.average || (Math.random() * 4 + 6); // Random rating between 6-10
    const year = show.premiered ? new Date(show.premiered).getFullYear() : 2020 + (index % 5);
    
    return {
      id: show.id || index,
      title: show.name || `Show ${index}`,
      description: show.summary ? show.summary.replace(/<[^>]*>/g, '') : 'An exciting entertainment experience awaits you.',
      thumbnail: show.image?.medium || show.image?.original || `https://images.pexels.com/photos/${1200450 + index}/pexels-photo-${1200450 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`,
      backdrop: show.image?.original || show.image?.medium || `https://images.pexels.com/photos/${1200450 + index}/pexels-photo-${1200450 + index}.jpeg?auto=compress&cs=tinysrgb&w=1200`,
      genre: genres,
      rating: Math.round(rating * 10) / 10,
      year: year,
      duration: show.runtime ? `${show.runtime}m` : '45m',
      type: Math.random() > 0.3 ? 'series' : 'movie',
      trending: Math.random() > 0.7,
      featured: rating > 8.0,
      maturityRating: show.rating?.average > 8 ? 'TV-MA' : 'TV-14',
      cast: ['Cast information available'],
      director: 'Director information available',
      releaseDate: show.premiered,
      originalTitle: show.name,
      popularity: show.weight || Math.random() * 100
    };
  }

  private getFallbackMovies(): Content[] {
    const fallbackMovies = [
      {
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
        thumbnail: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400',
        backdrop: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Crime', 'Drama'],
        rating: 9.0,
        year: 2008
      },
      {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        thumbnail: 'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=400',
        backdrop: 'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Sci-Fi', 'Thriller'],
        rating: 8.8,
        year: 2010
      },
      {
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        thumbnail: 'https://images.pexels.com/photos/7991664/pexels-photo-7991664.jpeg?auto=compress&cs=tinysrgb&w=400',
        backdrop: 'https://images.pexels.com/photos/7991664/pexels-photo-7991664.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Adventure', 'Drama', 'Sci-Fi'],
        rating: 8.6,
        year: 2014
      },
      {
        title: 'The Matrix',
        description: 'A computer programmer is led to fight an underground war against powerful computers who have constructed his entire reality with a system called the Matrix.',
        thumbnail: 'https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&w=400',
        backdrop: 'https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Sci-Fi'],
        rating: 8.7,
        year: 1999
      },
      {
        title: 'Pulp Fiction',
        description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
        thumbnail: 'https://images.pexels.com/photos/8111357/pexels-photo-8111357.jpeg?auto=compress&cs=tinysrgb&w=400',
        backdrop: 'https://images.pexels.com/photos/8111357/pexels-photo-8111357.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Crime', 'Drama'],
        rating: 8.9,
        year: 1994
      }
    ];

    return fallbackMovies.map((movie, index) => ({
      id: index + 1,
      title: movie.title,
      description: movie.description,
      thumbnail: movie.thumbnail,
      backdrop: movie.backdrop,
      genre: movie.genres,
      rating: movie.rating,
      year: movie.year,
      duration: '120m',
      type: 'movie' as const,
      trending: Math.random() > 0.5,
      featured: movie.rating > 8.5,
      maturityRating: 'PG-13',
      cast: ['Actor 1', 'Actor 2', 'Actor 3'],
      director: 'Director Name',
      releaseDate: `${movie.year}-01-01`,
      originalTitle: movie.title,
      popularity: movie.rating * 10
    }));
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

  private async fetchMovies(category: string): Promise<Content[]> {
    const allMovies = await this.fetchFreeMovies();
    
    // Filter and categorize movies based on the category
    switch (category) {
      case 'trending':
        return allMovies.filter(movie => movie.trending).slice(0, 20);
      case 'popular':
        return allMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
      case 'top-rated':
        return allMovies.sort((a, b) => b.rating - a.rating).slice(0, 20);
      case 'action':
        return allMovies.filter(movie => movie.genre.some(g => g.toLowerCase().includes('action'))).slice(0, 20);
      case 'comedy':
        return allMovies.filter(movie => movie.genre.some(g => g.toLowerCase().includes('comedy'))).slice(0, 20);
      case 'drama':
        return allMovies.filter(movie => movie.genre.some(g => g.toLowerCase().includes('drama'))).slice(0, 20);
      case 'horror':
        return allMovies.filter(movie => movie.genre.some(g => g.toLowerCase().includes('horror'))).slice(0, 20);
      case 'scifi':
        return allMovies.filter(movie => movie.genre.some(g => g.toLowerCase().includes('sci') || g.toLowerCase().includes('fantasy'))).slice(0, 20);
      default:
        return allMovies.slice(0, 20);
    }
  }

  private async fetchTVShows(category: string): Promise<Content[]> {
    const allShows = await this.fetchFreeMovies();
    const tvShows = allShows.filter(content => content.type === 'series');
    
    switch (category) {
      case 'popular':
        return tvShows.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
      case 'top-rated':
        return tvShows.sort((a, b) => b.rating - a.rating).slice(0, 20);
      case 'action':
        return tvShows.filter(show => show.genre.some(g => g.toLowerCase().includes('action'))).slice(0, 20);
      case 'comedy':
        return tvShows.filter(show => show.genre.some(g => g.toLowerCase().includes('comedy'))).slice(0, 20);
      case 'drama':
        return tvShows.filter(show => show.genre.some(g => g.toLowerCase().includes('drama'))).slice(0, 20);
      case 'scifi':
        return tvShows.filter(show => show.genre.some(g => g.toLowerCase().includes('sci') || g.toLowerCase().includes('fantasy'))).slice(0, 20);
      default:
        return tvShows.slice(0, 20);
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
      const movies = await this.fetchMovies('popular');
      const featured = movies.find(movie => movie.featured) || movies[0];
      return of(featured);
    } catch (error) {
      console.error('Error getting featured content:', error);
      return of(this.getFallbackContent());
    }
  }

  async getCategories(): Promise<Observable<Category[]>> {
    try {
      const [trending, popular, topRated, action, comedy, drama, tvPopular, tvTopRated] = await Promise.all([
        this.fetchMovies('trending'),
        this.fetchMovies('popular'),
        this.fetchMovies('top-rated'),
        this.fetchMovies('action'),
        this.fetchMovies('comedy'),
        this.fetchMovies('drama'),
        this.fetchTVShows('popular'),
        this.fetchTVShows('top-rated')
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
          id: 'drama',
          name: 'Drama Movies',
          content: drama.slice(0, 20)
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
      const [popular, topRated, action, comedy, drama, horror, scifi] = await Promise.all([
        this.fetchMovies('popular'),
        this.fetchMovies('top-rated'),
        this.fetchMovies('action'),
        this.fetchMovies('comedy'),
        this.fetchMovies('drama'),
        this.fetchMovies('horror'),
        this.fetchMovies('scifi')
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
          id: 'drama-movies',
          name: 'Drama Movies',
          content: drama.slice(0, 20)
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
      const [popular, topRated, action, comedy, drama, scifi] = await Promise.all([
        this.fetchTVShows('popular'),
        this.fetchTVShows('top-rated'),
        this.fetchTVShows('action'),
        this.fetchTVShows('comedy'),
        this.fetchTVShows('drama'),
        this.fetchTVShows('scifi')
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
      const allContent = await this.fetchFreeMovies();
      const searchResults = allContent.filter(content => 
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
      );
      
      return of(searchResults.slice(0, 20));
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
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
      thumbnail: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400',
      backdrop: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',
      genre: ['Action', 'Crime', 'Drama'],
      rating: 9.0,
      year: 2008,
      duration: '120m',
      type: 'movie',
      featured: true,
      maturityRating: 'PG-13',
      cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
      director: 'Christopher Nolan'
    };
  }
}