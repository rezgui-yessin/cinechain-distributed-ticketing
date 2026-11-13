import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResaleListing, ResaleCreateRequest, ResaleBuyRequest, TicketNftStub } from '../models/resale.model';

@Injectable({
  providedIn: 'root'
})
export class ResaleService {
  private resaleApi = '/api/resale';
  private nftApi = '/api/nft-stubs';

  constructor(private http: HttpClient) {}

  getMarketplaceListings(): Observable<ResaleListing[]> {
    return this.http.get<ResaleListing[]>(`${this.resaleApi}/marketplace`);
  }

  getMyListings(): Observable<ResaleListing[]> {
    return this.http.get<ResaleListing[]>(`${this.resaleApi}/my-listings`);
  }

  getMyPurchases(): Observable<ResaleListing[]> {
    return this.http.get<ResaleListing[]>(`${this.resaleApi}/my-purchases`);
  }

  createListing(req: ResaleCreateRequest): Observable<ResaleListing> {
    return this.http.post<ResaleListing>(`${this.resaleApi}/list`, req);
  }

  buyListing(listingId: number, req: ResaleBuyRequest): Observable<ResaleListing> {
    return this.http.post<ResaleListing>(`${this.resaleApi}/${listingId}/buy`, req);
  }

  cancelListing(listingId: number): Observable<ResaleListing> {
    return this.http.post<ResaleListing>(`${this.resaleApi}/${listingId}/cancel`, {});
  }

  // NFT Commemorative Stubs
  getMyNftStubs(): Observable<TicketNftStub[]> {
    return this.http.get<TicketNftStub[]>(`${this.nftApi}/my-stubs`);
  }

  getStubByTicketId(ticketId: number): Observable<TicketNftStub> {
    return this.http.get<TicketNftStub>(`${this.nftApi}/ticket/${ticketId}`);
  }

  claimNftStub(ticketId: number): Observable<TicketNftStub> {
    return this.http.post<TicketNftStub>(`${this.nftApi}/claim/${ticketId}`, {});
  }
}
