import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, MovieReview, MovieSentimentSummary } from '../../../../core/services/ai.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-movie-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movie-reviews.component.html'
})
export class MovieReviewsComponent implements OnInit {
  @Input() movieId!: number;

  reviews: MovieReview[] = [];
  sentiment: MovieSentimentSummary | null = null;
  loadingReviews = true;
  loadingSentiment = true;
  submitting = false;

  // New review form
  newRating: number = 5;
  newContent: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private aiService: AiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.movieId) {
      this.loadReviews();
      this.loadSentiment();
    }
  }

  loadReviews(): void {
    this.loadingReviews = true;
    this.aiService.getReviews(this.movieId).subscribe({
      next: (data) => {
        this.reviews = data;
        this.loadingReviews = false;
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        this.loadingReviews = false;
      }
    });
  }

  loadSentiment(): void {
    this.loadingSentiment = true;
    this.aiService.getSentiment(this.movieId).subscribe({
      next: (data) => {
        this.sentiment = data;
        this.loadingSentiment = false;
      },
      error: (err) => {
        console.error('Failed to load sentiment summary', err);
        this.loadingSentiment = false;
      }
    });
  }

  submitReview(): void {
    if (!this.newContent.trim()) {
      this.errorMessage = 'Please write some thoughts in your review.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.aiService.submitReview(this.movieId, this.newRating, this.newContent.trim()).subscribe({
      next: (created) => {
        this.submitting = false;
        this.newContent = '';
        this.newRating = 5;
        this.successMessage = '✨ Review analyzed by Gemini and published!';
        this.loadReviews();
        this.loadSentiment();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Could not post review. Please ensure you are signed in.';
      }
    });
  }

  getSentimentBadgeColor(sentiment?: string): string {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
      case 'VERY POSITIVE':
      case 'MOSTLY POSITIVE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'NEGATIVE':
      case 'VERY NEGATIVE':
      case 'MOSTLY NEGATIVE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MIXED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }
}
