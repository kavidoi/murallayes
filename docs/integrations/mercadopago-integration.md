# MercadoPago Integration Documentation

## Overview
This document describes the MercadoPago payment integration for the Muralla system, implementing the Payment Brick for secure payment processing in Chilean Pesos (CLP).

## Configuration

### Environment Variables
```bash
# Frontend (.env)
VITE_MP_PUBLIC_KEY=TEST-your-public-key-here

# Backend (.env)
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token-here
MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key-here
```

## Implementation Details

### Frontend Components

#### MercadoPagoCheckoutFixed.tsx
The main payment component that handles the Payment Brick initialization and payment processing.

**Key Features:**
- Single instance initialization to prevent duplicates
- Proper cleanup on unmount
- Chilean Peso (CLP) support with correct amount display
- Secure payment token handling

**Usage:**
```tsx
<MercadoPagoCheckout
  amount={1000}  // 1000 CLP
  title="Payment Title"
  description="Payment Description"
  customerEmail="customer@example.com"
  customerName="Customer Name"
  onSuccess={(result) => console.log('Payment successful:', result)}
  onError={(error) => console.error('Payment error:', error)}
  onPending={(result) => console.log('Payment pending:', result)}
  theme="default"
/>
```

### Backend API Endpoints

#### POST /mercadopago/process-payment
Processes a payment using the MercadoPago API.

**Request Body:**
```json
{
  "token": "payment_token_from_frontend",
  "payment_method_id": "visa",
  "transaction_amount": 1000,
  "installments": 1,
  "payer": {
    "email": "customer@example.com",
    "first_name": "Customer",
    "last_name": "Name",
    "identification": {
      "type": "RUT",
      "number": "12345678-9"
    }
  },
  "description": "Payment description",
  "idempotencyKey": "unique_key_for_this_payment"
}
```

**Response:**
```json
{
  "id": 124747566661,
  "status": "approved",
  "status_detail": "accredited",
  "payment_method_id": "visa",
  "payment_type_id": "credit_card",
  "date_created": "2025-09-07T19:24:39.738-04:00",
  "date_approved": "2025-09-07T19:24:42.696-04:00",
  "transaction_amount": 1000,
  "currency_id": "CLP"
}
```

#### POST /mercadopago/create-preference
Creates a payment preference for checkout.

**Request Body:**
```json
{
  "title": "Product Title",
  "quantity": 1,
  "unit_price": 1000,
  "currency_id": "CLP",
  "description": "Product description",
  "category_id": "others",
  "payer": {
    "name": "Customer Name",
    "email": "customer@example.com"
  }
}
```

#### POST /mercadopago/webhook
Handles MercadoPago webhook notifications for payment status updates.

## Payment Flow

1. **User enters payment amount** in the payment form
2. **Clicks "Pagar" button** to initiate payment
3. **Payment Brick loads** with MercadoPago's secure form
4. **User enters card details** (test card: 4349 5652 0000 0001)
5. **Payment is processed** through MercadoPago API
6. **Result is returned** (approved/pending/rejected)
7. **UI updates** based on payment status

## Test Cards for Chile

### Approved Payments
- **Visa**: 4349 5652 0000 0001
- **Mastercard**: 5416 7526 0258 2580

### Rejected Payments
- **Insufficient funds**: 4168 8188 4174 7115
- **Security code error**: 5160 0330 0471 4834

Use any future expiration date (e.g., 12/25) and any 3-digit CVV.

## Amount Handling

For Chilean Pesos (CLP):
- Enter amount directly (e.g., 1000 = 1000 CLP)
- No decimal places required
- Minimum amount: 1 CLP
- Maximum amount depends on card limits

## Security Considerations

1. **Token-based payments**: Card details never touch your server
2. **Idempotency keys**: Prevent duplicate payments
3. **HTTPS required**: In production environments
4. **PCI compliance**: Handled by MercadoPago's secure fields

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `payment_method_id attribute can't be null` | Missing payment method | Ensure payment method is extracted from form data |
| `Header X-Idempotency-Key can't be null` | Missing idempotency key | Generate unique key for each payment |
| `fields_setup_failed_after_3_tries` | Secure fields initialization failed | Check network and retry |
| `notificaction_url attribute must be url valid` | Invalid webhook URL | Ensure webhook URL is properly formatted |

## Integration Testing

### Test Checklist
- [ ] Payment form loads correctly
- [ ] Amount displays in CLP format
- [ ] Test card payments process successfully
- [ ] Webhook notifications are received
- [ ] Error states are handled gracefully
- [ ] Payment status updates correctly

### Integration Score Requirements
To achieve production-ready status (73+ score):
- Include all required payer fields
- Process test payments successfully
- Handle webhook notifications
- Implement proper error handling
- Include payment descriptions and metadata

## Production Deployment

1. **Update environment variables** with production keys
2. **Enable HTTPS** for secure payment processing
3. **Configure webhook URL** in MercadoPago dashboard
4. **Test with real cards** in production mode
5. **Monitor payment logs** for issues

## References

- [MercadoPago Official Documentation](https://www.mercadopago.cl/developers/es/docs)
- [Payment Brick Documentation](https://www.mercadopago.cl/developers/es/docs/checkout-bricks/payment-brick/introduction)
- [API Reference](https://www.mercadopago.cl/developers/es/reference)
- [Test Cards](https://www.mercadopago.cl/developers/es/docs/checkout-bricks/additional-content/test-cards)

## Support

For issues or questions:
- Check MercadoPago status: https://status.mercadopago.com/
- Developer support: https://www.mercadopago.cl/developers/es/support
- API logs: Available in MercadoPago dashboard
