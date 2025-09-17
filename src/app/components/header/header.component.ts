import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../services/content.service';
import { Content } from '../../models/content.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, from, of } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <div class="logo">
            <h1>StreamFlix</h1>
          </div>

          <!-- Navigation -->
          <nav class="nav">
            <a href="#" class="nav-link" [class.active]="currentPage === 'home'" (click)="navigateTo('home', $event)">Home</a>
            <a href="#" class="nav-link" [class.active]="currentPage === 'movies'" (click)="navigateTo('movies', $event)">Movies</a>
            <a href="#" class="nav-link" [class.active]="currentPage === 'tv-shows'" (click)="navigateTo('tv-shows', $event)">TV Shows</a>
            <a href="#" class="nav-link" [class.active]="currentPage === 'my-list'" (click)="navigateTo('my-list', $event)">My List</a>
          </nav>

          <!-- Search & Profile -->
          <div class="header-actions">
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Search movies, shows..." 
                class="search-input"
                [(ngModel)]="searchQuery"
                (input)="onSearchInput($event)"
                [class.active]="searchQuery.length > 0"
              />
              <div class="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              
              <!-- Search Results -->
              <div class="search-results" *ngIf="searchResults.length > 0 && searchQuery.length > 0">
                <div 
                  class="search-result-item" 
                  *ngFor="let content of searchResults"
                  (click)="selectContent(content)"
                >
                  <img [src]="content.thumbnail" [alt]="content.title" />
                  <div class="search-result-info">
                    <h4>{{ content.title }}</h4>
                    <p>{{ content.year }} • {{ content.type }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile">
              <img 
            <div class="profile-avatar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .header.scrolled {
      background-color: var(--background-black);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      gap: 40px;
    }

    .logo h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-red);
      margin: 0;
    }

    .nav {
      display: flex;
      gap: 32px;
      flex: 1;
      margin-left: 40px;
    }

    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: color 0.2s ease;
      position: relative;
    }

    .nav-link:hover,
    .nav-link.active {
      color: var(--text-primary);
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--primary-red);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .search-container {
      position: relative;
    }

    .search-input {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 40px 10px 16px;
      color: var(--text-primary);
      font-size: 14px;
      width: 280px;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-red);
      background: rgba(0, 0, 0, 0.8);
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--background-dark);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      margin-top: 8px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    }

    .search-result-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .search-result-item:hover {
      background-color: var(--background-gray);
    }

    .search-result-item img {
      width: 60px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }

    .search-result-info h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }

    .search-result-info p {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
    }

    .profile-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--background-gray);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .profile-avatar:hover {
      transform: scale(1.1);
      background: var(--background-light);
      color: var(--text-primary);
    }

    @media (max-width: 1024px) {
      .nav {
        display: none;
      }
      
      .search-input {
        width: 200px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        gap: 16px;
      }
      
      .logo h1 {
        font-size: 24px;
      }
      
      .search-input {
        width: 160px;
        font-size: 13px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  searchQuery = '';
  searchResults: Content[] = [];
  currentPage = 'home';
  private searchSubject = new Subject<string>();

  constructor(private contentService: ContentService) {}

  ngOnInit() {
    // Subscribe to current page changes
    this.contentService.getCurrentPage().subscribe(page => {
      this.currentPage = page;
    });

    // Setup search with debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          return of([]);
        }
        return from(this.contentService.searchContent(query)).pipe(
          switchMap(obs => obs)
        );
      })
    ).subscribe(results => {
      this.searchResults = results;
    });

    // Listen to scroll for header background
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    this.searchSubject.next(query);
    this.contentService.setSearchQuery(query);
  }

  selectContent(content: Content) {
    // Close search results
    this.searchQuery = '';
    this.searchResults = [];
    // In a real app, you would navigate to the content detail page
    console.log('Selected content:', content);
  }

  navigateTo(page: string, event: MouseEvent) {
    event.preventDefault();
    this.contentService.setCurrentPage(page);
  }

  isInWatchlist(contentId: number): boolean {
    return this.contentService.isInWatchlist(contentId);
  }

  private handleScroll() {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }
}