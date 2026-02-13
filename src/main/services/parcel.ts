import {
  ApiResponse,
  CategoryService,
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

  async getParcels(register: string): Promise<ApiResponse<Parcel[]>> {
    const query = new URLSearchParams();
    if (register) query.set('reg', register);
    
    const url = `/api/kiosk/service/active/all/parcel?${query.toString()}`;
    this.log.debug('Fetching parcels:', url);
    return api.get(url);
  }

  async getCategories(): Promise<ApiResponse<ServiceCategory[]> | ServiceCategory[]> {
    const url = '/api/category';
    this.log.debug('Fetching categories:', url);
    return api.get(url);
  }

  async getCategoryServices(catId: number): Promise<ApiResponse<CategoryService[]> | CategoryService[]> {
    const query = new URLSearchParams();
    query.set('cat_id', String(catId));

    const url = `/api/category/services?${query.toString()}`;
    this.log.debug('Fetching category services:', url);
    return api.get(url);
  }
}

export const parcel = ParcelService.get();
