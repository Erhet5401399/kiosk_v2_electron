import type {
  ApiResponse,
  CheckQpayInvoiceRequest,
  CheckQpayInvoiceResponse,
  CreateQpayInvoiceRequest,
  CreateQpayInvoiceResponse,
} from "../../shared/types";
import { api } from "./api";
import { logger } from "./logger";

class PaymentService {
  private static inst: PaymentService;
  private log = logger.child("Payment");

  static get(): PaymentService {
    return this.inst || (this.inst = new PaymentService());
  }

  async createQpayInvoice(
    req: CreateQpayInvoiceRequest,
  ): Promise<ApiResponse<CreateQpayInvoiceResponse> | CreateQpayInvoiceResponse> {
    const url = "/api/qpay/create/invoice";
    this.log.debug("Creating QPay invoice:", url);
    return api.post(url, req);
  }

  async checkQpayInvoice(
    req: CheckQpayInvoiceRequest,
  ): Promise<ApiResponse<CheckQpayInvoiceResponse> | CheckQpayInvoiceResponse> {
    const url = "/api/qpay/check/inoivce";
    this.log.debug("Checking QPay invoice:", url);
    return api.post(url, req);
  }
}

export const payment = PaymentService.get();
