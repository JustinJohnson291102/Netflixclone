import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, Content } from '../../models/content.model';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-content-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="content-row" *ngIf="category">
      <div class="container">
        <h2 class="row-title">{{ category.name }}</h2>
        <div class="carousel-container">
          <button 
            class="carousel-nav prev" 
            [class.visible]="canScrollLeft"
            (click)="scrollLeft()"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          
          <div class="carousel" #carousel (scroll)="onScroll()">
            <div 
              class="content-card" 
              *ngFor="let content of category.content"
              (click)="selectContent(content)"
              (mouseenter)="onCardHover(content, $event)"
              (mouseleave)="onCardLeave()"
            >
              <div class="card-image">
                <img [src]="content.thumbnail" [alt]="content.title" />
                <div class="card-overlay">
                  <div class="card-actions">
                    <button class="action-btn play" (click)="playContent(content, $event)">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    <button 
                      class="action-btn wishlist" 
                      [class.active]="isInWatchlist(content.id)"
                      (click)="toggleWatchlist(content, $event)"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="card-info">
                <h3 class="card-title">{{ content.title }}</h3>
                <div class="card-meta">
                  <span class="rating">★ {{ content.rating }}</span>
                  <span class="year">{{ content.year }}</span>
                  <span class="duration">{{ content.duration }}</span>
                </div>
                <div class="card-genres">
                  <span class="genre" *ngFor="let genre of content.genre.slice(0, 2)">{{ genre }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            class="carousel-nav next" 
            [class.visible]="canScrollRight"
            (click)="scrollRight()"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Content Detail Modal -->
    <div class="content-modal" *ngIf="selectedContent" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closeModal()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div class="modal-hero" [style.background-image]="'url(' + selectedContent.backdrop + ')'">
          <div class="modal-overlay"></div>
          <div class="modal-info">
            <h1>{{ selectedContent.title }}</h1>
            <div class="modal-meta">
              <span class="rating">{{ selectedContent.rating }}/10</span>
              <span class="year">{{ selectedContent.year }}</span>
              <span class="duration">{{ selectedContent.duration }}</span>
              <span class="maturity">{{ selectedContent.maturityRating }}</span>
            </div>
            <p class="modal-description">{{ selectedContent.description }}</p>
            <div class="modal-actions">
              <button class="btn btn-primary" (click)="playContent(selectedContent, $event)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </button>
              <button 
                class="btn btn-secondary"
                [class.active]="isInWatchlist(selectedContent.id)"
                (click)="toggleWatchlist(selectedContent, $event)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {{ isInWatchlist(selectedContent.id) ? 'Remove from List' : 'Add to List' }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-details">
          <div class="details-section">
            <h3>Cast</h3>
            <p>{{ selectedContent.cast.join(', ') }}</p>
          </div>
          <div class="details-section">
            <h3>Director</h3>
            <p>{{ selectedContent.director }}</p>
          </div>
          <div class="details-section">
            <h3>Genres</h3>
            <div class="genre-tags">
              <span class="genre-tag" *ngFor="let genre of selectedContent.genre">{{ genre }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-row {
      margin-bottom: 48px;
    }

    .row-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .carousel-container {
      position: relative;
    }

    .carousel {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      scroll-behavior: smooth;
      padding: 8px 0;
    }

    .carousel::-webkit-scrollbar {
      display: none;
    }

    .carousel-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: var(--text-primary);
      padding: 16px 12px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .carousel-nav.visible {
      opacity: 1;
      visibility: visible;
    }

    .carousel-nav:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: translateY(-50%) scale(1.1);
    }

    .carousel-nav.prev {
      left: -20px;
    }

    .carousel-nav.next {
      right: -20px;
    }

    .content-card {
      flex: 0 0 280px;
      cursor: pointer;
      transition: transform 0.3s ease;
      position: relative;
    }

    .content-card:hover {
      transform: scale(1.05);
      z-index: 5;
    }

    .card-image {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: flex-end;
      padding: 16px;
    }

    .content-card:hover .card-overlay {
      opacity: 1;
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      color: var(--background-black);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: var(--text-primary);
      transform: scale(1.1);
    }

    .action-btn.play {
      background: var(--primary-red);
      color: var(--text-primary);
    }

    .action-btn.wishlist.active {
      background: var(--success-green);
      color: var(--text-primary);
    }

    .card-info {
      padding: 0 4px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .card-meta .rating {
      color: var(--warning-yellow);
    }

    .card-genres {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .genre {
      font-size: 11px;
      color: var(--text-muted);
      background: var(--background-gray);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .content-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(10px);
    }

    .modal-content {
      background: var(--background-dark);
      border-radius: 12px;
      overflow: hidden;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      color: var(--text-primary);
      padding: 8px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10;
      transition: background-color 0.2s ease;
    }

    .modal-close:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    .modal-hero {
      position: relative;
      height: 400px;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
    }

    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 60%);
    }

    .modal-info {
      position: relative;
      z-index: 2;
      padding: 40px;
    }

    .modal-info h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .modal-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .modal-meta span {
      font-size: 14px;
      font-weight: 500;
    }

    .modal-meta .rating {
      background: var(--warning-yellow);
      color: var(--background-black);
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .modal-meta .maturity {
      border: 1px solid var(--text-secondary);
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .modal-description {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
      color: var(--text-secondary);
    }

    .modal-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .modal-details {
      padding: 40px;
      display: grid;
      gap: 24px;
    }

    .details-section h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .details-section p {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .genre-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .genre-tag {
      background: var(--background-gray);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 14px;
    }

    .modal-trailer {
      padding: 0 40px 20px;
    }

    .trailer-container h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .trailer-iframe {
      width: 100%;
      height: 400px;
      border-radius: 8px;
    }
    @media (max-width: 1024px) {
      .content-card {
        flex: 0 0 240px;
      }
      
      .carousel-nav {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .content-card {
        flex: 0 0 200px;
      }
      
      .modal-content {
        margin: 10px;
        max-height: 95vh;
      }
      
      .modal-hero {
        height: 300px;
      }
      
      .modal-info {
        padding: 20px;
      }
      
      .modal-details {
        padding: 20px;
      }
      
      .modal-trailer {
        padding: 0 20px 20px;
      }
      
      .trailer-iframe {
        height: 250px;
      }
    }
  `]
})
export class ContentRowComponent implements OnInit, AfterViewInit {
  @Input() category: Category | null = null;
  @ViewChild('carousel', { static: false }) carousel!: ElementRef;
  
  selectedContent: Content | null = null;
  canScrollLeft = false;
  canScrollRight = true;

  constructor(private contentService: ContentService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.carousel) {
      setTimeout(() => this.updateScrollButtons(), 100);
    }
  }

  onScroll() {
    this.updateScrollButtons();
  }

  updateScrollButtons() {
    if (!this.carousel) return;
    
    const element = this.carousel.nativeElement;
    this.canScrollLeft = element.scrollLeft > 0;
    this.canScrollRight = element.scrollLeft < element.scrollWidth - element.clientWidth - 10;
  }

  scrollLeft() {
    if (this.carousel) {
      this.carousel.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.carousel) {
      this.carousel.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }

  selectContent(content: Content) {
    this.selectedContent = content;
  }

  closeModal() {
    this.selectedContent = null;
  }

  onCardHover(content: Content, event: MouseEvent) {
    // Add hover effects or preview functionality here
  }

  onCardLeave() {
    // Remove hover effects here
  }

  playContent(content: Content, event: MouseEvent) {
    event.stopPropagation();
    // Implement video player logic here
    console.log('Playing:', content.title);
  }

  toggleWatchlist(content: Content, event: MouseEvent) {
    event.stopPropagation();
    if (this.isInWatchlist(content.id)) {
      this.contentService.removeFromWatchlist(content.id);
    } else {
      this.contentService.addToWatchlist(content);
    }
  }

  isInWatchlist(contentId: number): boolean {
    return this.contentService.isInWatchlist(contentId);
  }
}