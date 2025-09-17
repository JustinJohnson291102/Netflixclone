import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { HeaderComponent } from './app/components/header/header.component';
import { HeroComponent } from './app/components/hero/hero.component';
import { ContentRowComponent } from './app/components/content-row/content-row.component';
import { FooterComponent } from './app/components/footer/footer.component';
import { LoadingComponent } from './app/components/loading/loading.component';
import { ContentService } from './app/services/content.service';
import { Category } from './app/models/content.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HeroComponent,
    ContentRowComponent,
    FooterComponent,
    LoadingComponent
  ],
  template: `
    <div class="app">
      <app-header></app-header>
      
      <main class="main-content">
        <app-hero *ngIf="currentPage === 'home'"></app-hero>
        
        <!-- Home Page -->
        <div class="content-sections" *ngIf="!isLoading && currentPage === 'home'">
          <app-content-row
            *ngFor="let category of categories"
            [category]="category"
          ></app-content-row>
        </div>
        
        <!-- Movies Page -->
        <div class="content-sections movies-page" *ngIf="!isLoading && currentPage === 'movies'">
          <div class="page-header">
            <div class="container">
              <h1>Movies</h1>
              <p>Discover amazing movies from around the world</p>
            </div>
          </div>
          <app-content-row
            *ngFor="let category of movieCategories"
            [category]="category"
          ></app-content-row>
        </div>
        
        <!-- TV Shows Page -->
        <div class="content-sections tv-shows-page" *ngIf="!isLoading && currentPage === 'tv-shows'">
          <div class="page-header">
            <div class="container">
              <h1>TV Shows</h1>
              <p>Binge-watch the best series and shows</p>
            </div>
          </div>
          <app-content-row
            *ngFor="let category of tvCategories"
            [category]="category"
          ></app-content-row>
        </div>
        
        <!-- My List Page -->
        <div class="content-sections my-list-page" *ngIf="!isLoading && currentPage === 'my-list'">
          <div class="page-header">
            <div class="container">
              <h1>My List</h1>
              <p *ngIf="watchlistItems.length === 0">Your watchlist is empty. Add some movies and shows!</p>
              <p *ngIf="watchlistItems.length > 0">{{ watchlistItems.length }} items in your watchlist</p>
            </div>
          </div>
          <div class="watchlist-grid" *ngIf="watchlistItems.length > 0">
            <div class="container">
              <div class="grid">
                <div 
                  class="watchlist-item" 
                  *ngFor="let item of watchlistItems"
                  (click)="selectWatchlistItem(item)"
                >
                  <div class="item-image">
                    <img [src]="item.thumbnail" [alt]="item.title" />
                    <div class="item-overlay">
                      <button class="remove-btn" (click)="removeFromWatchlist(item, $event)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="item-info">
                    <h3>{{ item.title }}</h3>
                    <div class="item-meta">
                      <span class="rating">★ {{ item.rating }}</span>
                      <span class="year">{{ item.year }}</span>
                      <span class="type">{{ item.type === 'movie' ? 'Movie' : 'TV Show' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <app-loading *ngIf="isLoading"></app-loading>
      </main>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      background-color: var(--background-black);
    }

    .main-content {
      position: relative;
    }

    .content-sections {
      padding: 40px 0;
    }
    
    .content-sections.movies-page,
    .content-sections.tv-shows-page,
    .content-sections.my-list-page {
      padding-top: 120px;
      background: var(--background-black);
    }
    
    .page-header {
      padding: 40px 0 60px;
      background: linear-gradient(135deg, var(--background-dark), var(--background-black));
    }
    
    .page-header h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--text-primary);
    }
    
    .page-header p {
      font-size: 18px;
      color: var(--text-secondary);
      margin: 0;
    }
    
    .watchlist-grid {
      padding: 40px 0;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    
    .watchlist-item {
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    
    .watchlist-item:hover {
      transform: scale(1.05);
    }
    
    .item-image {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .item-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .watchlist-item:hover .item-overlay {
      opacity: 1;
    }
    
    .remove-btn {
      background: var(--primary-red);
      border: none;
      color: var(--text-primary);
      padding: 12px;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .remove-btn:hover {
      transform: scale(1.1);
    }
    
    .item-info h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .item-meta {
      display: flex;
      gap: 12px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    
    .item-meta .rating {
      color: var(--warning-yellow);
    }

    @media (max-width: 768px) {
      .content-sections {
        padding: 20px 0;
      }
      
      .page-header h1 {
        font-size: 36px;
      }
      
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
    }
  `],
  providers: [ContentService]
})
export class App implements OnInit {
  categories: Category[] = [];
  movieCategories: Category[] = [];
  tvCategories: Category[] = [];
  watchlistItems: any[] = [];
  currentPage = 'home';
  isLoading = true;

  constructor(private contentService: ContentService) {}

  async ngOnInit() {
    // Subscribe to page changes
    this.contentService.getCurrentPage().subscribe(page => {
      this.currentPage = page;
      this.loadPageContent();
    });
    
    // Subscribe to watchlist changes
    this.contentService.getWatchlist().subscribe(items => {
      this.watchlistItems = items;
    });
    
    // Load initial content
    this.loadPageContent();
  }
  
  async loadPageContent() {
    this.isLoading = true;
    
    try {
      switch (this.currentPage) {
        case 'home':
          (await this.contentService.getCategories()).subscribe(categories => {
            this.categories = categories;
            this.isLoading = false;
          });
          break;
          
        case 'movies':
          (await this.contentService.getMoviesOnly()).subscribe(categories => {
            this.movieCategories = categories;
            this.isLoading = false;
          });
          break;
          
        case 'tv-shows':
          (await this.contentService.getTVShowsOnly()).subscribe(categories => {
            this.tvCategories = categories;
            this.isLoading = false;
          });
          break;
          
        case 'my-list':
          this.isLoading = false;
          break;
          
        default:
          (await this.contentService.getCategories()).subscribe(categories => {
            this.categories = categories;
            this.isLoading = false;
          });
      }
    } catch (error) {
      console.error('Error loading page content:', error);
        this.isLoading = false;
    }
  }
  
  selectWatchlistItem(item: any) {
    console.log('Selected watchlist item:', item);
    // In a real app, this would open the content detail modal
  }
  
  removeFromWatchlist(item: any, event: MouseEvent) {
    event.stopPropagation();
    this.contentService.removeFromWatchlist(item.id);
  }
}

bootstrapApplication(App);