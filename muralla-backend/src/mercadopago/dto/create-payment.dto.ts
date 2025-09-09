export class CreatePaymentDto {
  // Transaction details
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  token?: string;
  installments: number;
  
  // Payer information (REQUIRED for better approval)
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification?: {
      type: string;
      number: string;
    };
    address?: {
      street_name: string;
      street_number: number;
      zip_code: string;
      neighborhood?: string;
      city?: string;
      federal_unit?: string;
    };
    phone?: {
      area_code: string;
      number: string;
    };
  };
  
  // Item details (REQUIRED for integration score)
  items: Array<{
    id: string;
    title: string;
    description: string;
    category_id: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
    picture_url?: string;
  }>;
  
  // Additional required fields
  external_reference: string; // Your internal order ID
  notification_url?: string; // Webhook URL
  statement_descriptor?: string; // What appears on card statement
  
  // Back URLs for redirects
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  
  // Additional metadata
  metadata?: any;
  binary_mode?: boolean; // For instant approval
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  date_of_expiration?: string; // For cash payments
  
  // Shipping information
  shipments?: {
    cost: number;
    mode: string;
    receiver_address: {
      street_name: string;
      street_number: number;
      zip_code: string;
    };
  };
}
