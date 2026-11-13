import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

export interface RecommendedMovie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  rating: number;
  reason: string;
}

export interface AiChatResponse {
  reply: string;
  recommendedMovies: RecommendedMovie[];
}

export interface MovieReview {
  id?: number;
  movieId: number;
  movieTitle?: string;
  authorId?: number;
  authorName?: string;
  rating: number;
  content: string;
  sentiment?: string;
  tags?: string;
  isSpoiler?: boolean;
  isFlagged?: boolean;
  createdAt?: string;
}

export interface MovieSentimentSummary {
  movieId: number;
  movieTitle: string;
  totalReviews: number;
  averageRating: number;
  overallSentiment: string;
  aiSummary: string;
  topPros: string[];
  topCons: string[];
  keyThemes: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly API_URL = 'http://localhost:8080/api/ai';

  constructor(private http: HttpClient) {}

  chat(message: string, history: ChatMessage[] = []): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.API_URL}/chat`, { message, history });
  }

  getReviews(movieId: number): Observable<MovieReview[]> {
    return this.http.get<MovieReview[]>(`${this.API_URL}/movies/${movieId}/reviews`);
  }

  submitReview(movieId: number, rating: number, content: string): Observable<MovieReview> {
    return this.http.post<MovieReview>(`${this.API_URL}/movies/${movieId}/reviews`, {
      movieId,
      rating,
      content
    });
  }

  getSentiment(movieId: number): Observable<MovieSentimentSummary> {
    return this.http.get<MovieSentimentSummary>(`${this.API_URL}/movies/${movieId}/sentiment`);
  }
}
