import { HttpService } from '@nestjs/axios';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';
import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

@Injectable()
export class HTTPAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  private base_url: string;

  constructor(
    private httpService: HttpService,
    config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.base_url = config.get<string>('ATC_BASE_URL', 'http://localhost:4000');
  }

  async getClubs(placeId: string): Promise<Club[]> {
    const cacheKey = `clubs_${placeId}`;
    const cachedResponse = await this.cacheManager.get<Club[]>(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await this.httpService.axiosRef
      .get('clubs', {
        baseURL: this.base_url,
        params: { placeId },
      })
      .then((res) => res.data);

    await this.cacheManager.set(cacheKey, response, 300); // Cache for 5 minutes
    return response;
  }

  async getCourts(clubId: number): Promise<Court[]> {
    const cacheKey = `courts_${clubId}`;
    const cachedResponse = await this.cacheManager.get<Court[]>(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await this.httpService.axiosRef
      .get(`/clubs/${clubId}/courts`, {
        baseURL: this.base_url,
      })
      .then((res) => res.data);

    await this.cacheManager.set(cacheKey, response, 60); // Cache for 5 minutes
    return response;
  }

  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[]> {
    const cacheKey = `slots_${clubId}_${courtId}_${moment(date).format('YYYY-MM-DD')}`;
    const cachedResponse = await this.cacheManager.get<Slot[]>(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await this.httpService.axiosRef
      .get(`/clubs/${clubId}/courts/${courtId}/slots`, {
        baseURL: this.base_url,
        params: { date: moment(date).format('YYYY-MM-DD') },
      })
      .then((res) => res.data);

    await this.cacheManager.set(cacheKey, response, 300); // Cache for 5 minutes
    return response;
  }
}