import {
  ApiResponse,
  Parcel,
  ServiceCategory,
} from '../../shared/types';
import { api } from './api';
import { logger } from './logger';

class ParcelService {
  private static inst: ParcelService;
  private log = logger.child('Parcel');

  static get(): ParcelService {
    return this.inst || (this.inst = new ParcelService());
  }

  async getParcels(register: string): Promise<ApiResponse<Parcel[]> | Parcel[]> {
    const reg = String(register || "").trim().toUpperCase();
    if (!reg) {
      this.log.warn("Skipping parcel fetch: empty register number");
      return [];
    }

    const query = new URLSearchParams();
    query.set('register_number', reg);

    const url = `/api/kiosk/service/active/all/parcel?${query.toString()}`;
    this.log.debug('Fetching parcels:', url);
    return api.post(url);
  }

  async getCategories(): Promise<ApiResponse<ServiceCategory[]> | ServiceCategory[]> {
    const url = '/api/kiosk/service/category/tree';
    this.log.debug('Fetching categories:', url);
    return api.post(url);
  }
}

export const parcel = ParcelService.get();
