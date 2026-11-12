import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly API_URL = 'http://localhost:8080/api/movies';

  constructor(private http: HttpClient) {}

  getMovies(page = 0, size = 10, status?: string, genre?: string, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    if (genre) params = params.set('genre', genre);
    if (search) params = params.set('search', search);

    return this.http.get<any>(this.API_URL, { params });
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${this.API_URL}/${id}`);
  }

  createMovie(data: Partial<Movie>): Observable<Movie> {
    return this.http.post<Movie>(this.API_URL, data);
  }

  updateMovie(id: number, data: Partial<Movie>): Observable<Movie> {
    return this.http.put<Movie>(`${this.API_URL}/${id}`, data);
  }

  deleteMovie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getAdminMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.API_URL}/all`);
  }
}
