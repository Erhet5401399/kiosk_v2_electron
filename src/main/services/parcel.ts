import { ApiResponse, Parcel } from '../../shared/types';
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
    
    const url = `/getParcels${query.toString() ? '?' + query.toString() : ''}`;
    this.log.debug('Fetching parcels:', url);
    return api.get(url);
  }
}

export const parcel = ParcelService.get();
