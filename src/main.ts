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
        <app-hero></app-hero>
        
        <div class="content-sections" *ngIf="!isLoading">
          <app-content-row
            *ngFor="let category of categories"
            [category]="category"
          ></app-content-row>
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
      background: linear-gradient(
        180deg,
        transparent 0%,
        var(--background-black) 20%
      );
    }

    @media (max-width: 768px) {
      .content-sections {
        padding: 20px 0;
      }
    }
  `],
  providers: [ContentService]
})
export class App implements OnInit {
  categories: Category[] = [];
  isLoading = true;

  constructor(private contentService: ContentService) {}

  ngOnInit() {
    this.isLoading = true;
    this.contentService.getCategories().subscribe(categories => {
        this.isLoading = false;
      this.categories = categories;
    });
  }
}

bootstrapApplication(App);