import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Content } from '../../models/content.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero" *ngIf="featuredContent" [style.background-image]="'url(' + featuredContent.backdrop + ')'">
      <div class="hero-overlay"></div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-info">
            <h1 class="hero-title">{{ featuredContent.title }}</h1>
            <div class="hero-meta">
              <span class="rating">{{ featuredContent.rating }}/10</span>
              <span class="year">{{ featuredContent.year }}</span>
              <span class="duration">{{ featuredContent.duration }}</span>
              <span class="maturity-rating">{{ featuredContent.maturityRating }}</span>
            </div>
            <p class="hero-description">{{ featuredContent.description }}</p>
            <div class="hero-actions">
              <button class="btn btn-primary" (click)="playContent()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </button>
              <button class="btn btn-secondary" (click)="addToWatchlist()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                My List
              </button>
              <button class="btn btn-secondary" (click)="showMoreInfo()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                More Info
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Video Player Overlay (if playing) -->
      <div class="video-overlay" *ngIf="isPlaying" (click)="stopPlaying()">
        <div class="video-container" (click)="$event.stopPropagation()">
          <div class="video-player">
            <div class="video-placeholder">
              <div class="play-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p>{{ featuredContent.title }} - Trailer</p>
            </div>
            <div class="video-controls">
              <button class="control-btn" (click)="stopPlaying()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <div class="progress-bar">
                <div class="progress" [style.width]="playProgress + '%'"></div>
              </div>
              <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}</span>
            </div>
          </div>
          <button class="close-btn" (click)="stopPlaying()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      height: 80vh;
      min-height: 600px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        to right,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.4) 50%,
        transparent 100%
      ),
      linear-gradient(
        to top,
        rgba(0, 0, 0, 0.8) 0%,
        transparent 60%
      );
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 600px;
      padding-top: 80px;
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 700;
      margin-bottom: 16px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .hero-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      align-items: center;
      flex-wrap: wrap;
    }

    .hero-meta span {
      font-size: 14px;
      font-weight: 500;
    }

    .rating {
      background: var(--warning-yellow);
      color: var(--background-black);
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .maturity-rating {
      border: 1px solid var(--text-secondary);
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .hero-description {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
      color: var(--text-secondary);
      max-width: 500px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .video-overlay {
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
      backdrop-filter: blur(10px);
    }

    .video-container {
      position: relative;
      width: 90%;
      max-width: 1200px;
      aspect-ratio: 16/9;
      background: var(--background-black);
      border-radius: 8px;
      overflow: hidden;
    }

    .video-player {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .video-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--background-dark), var(--background-gray));
    }

    .play-icon {
      color: var(--primary-red);
      margin-bottom: 16px;
      opacity: 0.8;
    }

    .video-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: var(--background-dark);
    }

    .control-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .control-btn:hover {
      background: var(--background-gray);
    }

    .progress-bar {
      flex: 1;
      height: 4px;
      background: var(--background-gray);
      border-radius: 2px;
      overflow: hidden;
      cursor: pointer;
    }

    .progress {
      height: 100%;
      background: var(--primary-red);
      transition: width 0.2s ease;
    }

    .time {
      font-size: 14px;
      color: var(--text-secondary);
      min-width: 120px;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    @media (max-width: 768px) {
      .hero {
        height: 70vh;
        min-height: 500px;
      }
      
      .hero-content {
        padding-top: 60px;
      }
      
      .hero-actions {
        gap: 12px;
      }
      
      .btn {
        padding: 10px 20px;
        font-size: 13px;
      }
      
      .video-container {
        width: 95%;
        margin: 20px;
      }
    }
  `]
})
export class HeroComponent implements OnInit {
  featuredContent: Content | null = null;
  isPlaying = false;
  playProgress = 0;
  currentTime = 0;
  totalTime = 120; // 2 minutes for demo

  constructor(private contentService: ContentService) {}

  ngOnInit() {
    this.contentService.getFeaturedContent().then(obs => {
      obs.subscribe(content => {
        this.featuredContent = content;
      });
    });
  }

  playContent() {
    this.isPlaying = true;
    this.startPlaybackSimulation();
  }

  stopPlaying() {
    this.isPlaying = false;
    this.playProgress = 0;
    this.currentTime = 0;
  }

  addToWatchlist() {
    if (this.featuredContent) {
      this.contentService.addToWatchlist(this.featuredContent);
      // Show toast notification in real app
      console.log('Added to watchlist:', this.featuredContent.title);
    }
  }

  showMoreInfo() {
    if (this.featuredContent) {
      this.contentService.getMovieDetails(this.featuredContent.id).then(obs => {
        obs.subscribe(detailedContent => {
          // Update the featured content with detailed information
          this.featuredContent = detailedContent;
          console.log('Detailed info:', detailedContent);
        });
      });
    }
  }

  private startPlaybackSimulation() {
    const interval = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(interval);
        return;
      }
      
      this.currentTime += 1;
      this.playProgress = (this.currentTime / this.totalTime) * 100;
      
      if (this.currentTime >= this.totalTime) {
        this.stopPlaying();
        clearInterval(interval);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}