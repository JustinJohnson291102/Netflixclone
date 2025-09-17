import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Content, Category, TMDBMovie, TMDBResponse, Genre, TMDBTVShow, TMDBMovieDetails, TMDBTVDetails } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  // Using TMDB API - you can get a free API key from https://www.themoviedb.org/settings/api
  private readonly TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZjU5YzJjYzQzYzY0NzBkYjY5NzNkNzY5MzY5NzY5NiIsInN1YiI6IjY0YzY0NzBkYjY5NzNkNzY5MzY5NzY5NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.example'; // This is a placeholder
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
  
  // Using OMDb API as backup (free with limited requests)
  private readonly OMDB_API_KEY = 'trilogy'; // Free API key for demo
  private readonly OMDB_BASE_URL = 'https://www.omdbapi.com';
  
  private searchQuery$ = new BehaviorSubject<string>('');
  private watchlist$ = new BehaviorSubject<Content[]>([]);
  private currentPage$ = new BehaviorSubject<string>('home');
  private genres: Genre[] = [];
  private tvGenres: Genre[] = [];
  private allContent: Content[] = [];

  constructor() {
    this.initializeGenres();
    this.loadInitialContent();
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

  private async loadInitialContent(): Promise<void> {
    try {
      // Load popular movies from multiple sources
      const popularMovies = await this.fetchPopularMovies();
      const topRatedMovies = await this.fetchTopRatedMovies();
      const actionMovies = await this.fetchMoviesByGenre('action');
      const comedyMovies = await this.fetchMoviesByGenre('comedy');
      
      this.allContent = [
        ...popularMovies,
        ...topRatedMovies,
        ...actionMovies,
        ...comedyMovies
      ];
    } catch (error) {
      console.error('Error loading initial content:', error);
      this.allContent = this.getFallbackMovies();
    }
  }

  private async fetchPopularMovies(): Promise<Content[]> {
    try {
      // Try TMDB first, then fallback to OMDb
      const response = await fetch(`${this.OMDB_BASE_URL}/?s=batman&apikey=${this.OMDB_API_KEY}`);
      const data = await response.json();
      
      if (data.Response === 'True' && data.Search) {
        const movies = await Promise.all(
          data.Search.slice(0, 10).map(async (movie: any) => {
            const details = await this.fetchOMDbDetails(movie.imdbID);
            return this.convertOMDbToContent(details, movie);
          })
        );
        return movies.filter(movie => movie !== null);
      }
      
      return this.getFallbackMovies();
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return this.getFallbackMovies();
    }
  }

  private async fetchTopRatedMovies(): Promise<Content[]> {
    try {
      const searches = ['avengers', 'inception', 'interstellar', 'godfather', 'pulp'];
      const movies: Content[] = [];
      
      for (const search of searches) {
        try {
          const response = await fetch(`${this.OMDB_BASE_URL}/?s=${search}&apikey=${this.OMDB_API_KEY}`);
          const data = await response.json();
          
          if (data.Response === 'True' && data.Search && data.Search.length > 0) {
            const movie = data.Search[0];
            const details = await this.fetchOMDbDetails(movie.imdbID);
            const content = this.convertOMDbToContent(details, movie);
            if (content) {
              movies.push(content);
            }
          }
        } catch (error) {
          console.error(`Error fetching ${search}:`, error);
        }
      }
      
      return movies.length > 0 ? movies : this.getFallbackMovies().slice(0, 5);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return this.getFallbackMovies().slice(0, 5);
    }
  }

  private async fetchMoviesByGenre(genre: string): Promise<Content[]> {
    try {
      const genreSearches: { [key: string]: string[] } = {
        action: ['matrix', 'terminator', 'die hard', 'john wick'],
        comedy: ['hangover', 'superbad', 'anchorman', 'dumb dumber'],
        drama: ['shawshank', 'forrest gump', 'titanic', 'gladiator'],
        horror: ['exorcist', 'halloween', 'friday 13th', 'nightmare elm']
      };
      
      const searches = genreSearches[genre] || ['movie'];
      const movies: Content[] = [];
      
      for (const search of searches) {
        try {
          const response = await fetch(`${this.OMDB_BASE_URL}/?s=${search}&apikey=${this.OMDB_API_KEY}`);
          const data = await response.json();
          
          if (data.Response === 'True' && data.Search && data.Search.length > 0) {
            const movie = data.Search[0];
            const details = await this.fetchOMDbDetails(movie.imdbID);
            const content = this.convertOMDbToContent(details, movie);
            if (content) {
              movies.push(content);
            }
          }
        } catch (error) {
          console.error(`Error fetching ${search}:`, error);
        }
      }
      
      return movies.length > 0 ? movies : this.getFallbackMovies().slice(0, 4);
    } catch (error) {
      console.error(`Error fetching ${genre} movies:`, error);
      return this.getFallbackMovies().slice(0, 4);
    }
  }

  private async fetchOMDbDetails(imdbID: string): Promise<any> {
    try {
      const response = await fetch(`${this.OMDB_BASE_URL}/?i=${imdbID}&apikey=${this.OMDB_API_KEY}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching OMDb details:', error);
      return null;
    }
  }

  private convertOMDbToContent(omdbData: any, searchResult: any): Content | null {
    if (!omdbData || omdbData.Response === 'False') {
      return null;
    }

    const genres = omdbData.Genre ? omdbData.Genre.split(', ') : ['Drama'];
    const rating = omdbData.imdbRating && omdbData.imdbRating !== 'N/A' 
      ? parseFloat(omdbData.imdbRating) 
      : Math.random() * 3 + 7; // Random rating between 7-10

    return {
      id: parseInt(omdbData.imdbID.replace('tt', '')) || Math.random() * 1000000,
      title: omdbData.Title || searchResult.Title,
      description: omdbData.Plot && omdbData.Plot !== 'N/A' 
        ? omdbData.Plot 
        : 'An exciting movie experience awaits you.',
      thumbnail: omdbData.Poster && omdbData.Poster !== 'N/A' 
        ? omdbData.Poster 
        : searchResult.Poster && searchResult.Poster !== 'N/A'
        ? searchResult.Poster
        : `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 1000000}.jpeg?auto=compress&cs=tinysrgb&w=400`,
      backdrop: omdbData.Poster && omdbData.Poster !== 'N/A' 
        ? omdbData.Poster.replace('300', '1280')
        : `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 1000000}.jpeg?auto=compress&cs=tinysrgb&w=1200`,
      genre: genres,
      rating: Math.round(rating * 10) / 10,
      year: omdbData.Year ? parseInt(omdbData.Year) : 2020,
      duration: omdbData.Runtime && omdbData.Runtime !== 'N/A' 
        ? omdbData.Runtime 
        : '120 min',
      type: omdbData.Type === 'series' ? 'series' : 'movie',
      trending: rating > 8.0,
      featured: rating > 8.5,
      maturityRating: omdbData.Rated && omdbData.Rated !== 'N/A' ? omdbData.Rated : 'PG-13',
      cast: omdbData.Actors && omdbData.Actors !== 'N/A' 
        ? omdbData.Actors.split(', ') 
        : ['Cast information not available'],
      director: omdbData.Director && omdbData.Director !== 'N/A' 
        ? omdbData.Director 
        : 'Director information not available',
      releaseDate: omdbData.Released,
      originalTitle: omdbData.Title,
      popularity: rating * 10
    };
  }

  private getFallbackMovies(): Content[] {
    const fallbackMovies = [
      {
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
        thumbnail: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
        backdrop: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Crime', 'Drama'],
        rating: 9.0,
        year: 2008,
        imdbID: 'tt0468569'
      },
      {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        thumbnail: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
        backdrop: 'https://images.pexels.com/photos/7991225/pexels-photo-7991225.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Sci-Fi', 'Thriller'],
        rating: 8.8,
        year: 2010,
        imdbID: 'tt1375666'
      },
      {
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        thumbnail: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
        backdrop: 'https://images.pexels.com/photos/7991664/pexels-photo-7991664.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Adventure', 'Drama', 'Sci-Fi'],
        rating: 8.6,
        year: 2014,
        imdbID: 'tt0816692'
      },
      {
        title: 'The Matrix',
        description: 'A computer programmer is led to fight an underground war against powerful computers who have constructed his entire reality with a system called the Matrix.',
        thumbnail: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg',
        backdrop: 'https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Sci-Fi'],
        rating: 8.7,
        year: 1999,
        imdbID: 'tt0133093'
      },
      {
        title: 'Pulp Fiction',
        description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
        thumbnail: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg',
        backdrop: 'https://images.pexels.com/photos/8111357/pexels-photo-8111357.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Crime', 'Drama'],
        rating: 8.9,
        year: 1994,
        imdbID: 'tt0110912'
      },
      {
        title: 'The Avengers',
        description: 'Earth\'s mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity.',
        thumbnail: 'https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
        backdrop: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        rating: 8.0,
        year: 2012,
        imdbID: 'tt0848228'
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
      duration: '120 min',
      type: 'movie' as const,
      trending: movie.rating > 8.5,
      featured: movie.rating > 8.5,
      maturityRating: 'PG-13',
      cast: ['Actor 1', 'Actor 2', 'Actor 3'],
      director: 'Director Name',
      releaseDate: `${movie.year}-01-01`,
      originalTitle: movie.title,
      popularity: movie.rating * 10
    }));
  }

  async getMovieDetails(movieId: number): Promise<Observable<Content>> {
    try {
      const content = this.allContent.find(c => c.id === movieId);
      if (content) {
        return of(content);
      }
      return of(this.getFallbackContent());
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return of(this.getFallbackContent());
    }
  }

  async getFeaturedContent(): Promise<Observable<Content>> {
    try {
      await this.loadInitialContent();
      const featured = this.allContent.find(movie => movie.featured) || this.allContent[0] || this.getFallbackContent();
      return of(featured);
    } catch (error) {
      console.error('Error getting featured content:', error);
      return of(this.getFallbackContent());
    }
  }

  async getCategories(): Promise<Observable<Category[]>> {
    try {
      await this.loadInitialContent();
      
      const categories: Category[] = [
        {
          id: 'trending',
          name: 'Trending Now',
          content: this.allContent.filter(c => c.trending).slice(0, 20)
        },
        {
          id: 'popular',
          name: 'Popular Movies',
          content: this.allContent.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)
        },
        {
          id: 'top-rated',
          name: 'Top Rated',
          content: this.allContent.sort((a, b) => b.rating - a.rating).slice(0, 20)
        },
        {
          id: 'action',
          name: 'Action Movies',
          content: this.allContent.filter(c => c.genre.some(g => g.toLowerCase().includes('action'))).slice(0, 20)
        },
        {
          id: 'comedy',
          name: 'Comedy Movies',
          content: this.allContent.filter(c => c.genre.some(g => g.toLowerCase().includes('comedy'))).slice(0, 20)
        },
        {
          id: 'drama',
          name: 'Drama Movies',
          content: this.allContent.filter(c => c.genre.some(g => g.toLowerCase().includes('drama'))).slice(0, 20)
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
      await this.loadInitialContent();
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
      await this.loadInitialContent();
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
      // Search OMDb API
      const response = await fetch(`${this.OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${this.OMDB_API_KEY}`);
      const data = await response.json();
      
      if (data.Response === 'True' && data.Search) {
        const searchResults = await Promise.all(
          data.Search.slice(0, 10).map(async (movie: any) => {
            const details = await this.fetchOMDbDetails(movie.imdbID);
            return this.convertOMDbToContent(details, movie);
          })
        );
        
        const validResults = searchResults.filter(result => result !== null);
        
        // Also search local content
        const localResults = this.allContent.filter(content => 
          content.title.toLowerCase().includes(query.toLowerCase()) ||
          content.description.toLowerCase().includes(query.toLowerCase()) ||
          content.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
        );
        
        return of([...validResults, ...localResults].slice(0, 20));
      }
      
      // Fallback to local search
      const localResults = this.allContent.filter(content => 
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
      );
      
      return of(localResults.slice(0, 20));
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
      thumbnail: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
      backdrop: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',
      genre: ['Action', 'Crime', 'Drama'],
      rating: 9.0,
      year: 2008,
      duration: '152 min',
      type: 'movie',
      featured: true,
      maturityRating: 'PG-13',
      cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
      director: 'Christopher Nolan'
    };
  }
}