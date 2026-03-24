import { NextRequest, NextResponse } from 'next/server';
import ModemPay from 'modem-pay';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency = 'GMD', uid, customer_name, customer_email, customer_phone, metadata } = body;

        if (!uid || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid user or amount' },
                { status: 400 }
            );
        }

        const secretKey = process.env.MODEM_PAY_SECRET_KEY || '';
        
        if (!secretKey) {
            return NextResponse.json(
                { success: false, error: 'Modem Pay configuration missing' },
                { status: 500 }
            );
        }

        // Initialize ModemPay SDK
        const modempay = new ModemPay(secretKey);
        const isProd = process.env.NODE_ENV === 'production';
        const baseUrl = isProd ? 'https://connekt.africa' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

        // Create payment intent using the ModemPay SDK
        const intent = await modempay.paymentIntents.create({
            amount,
            currency,
            customer_name,
            customer_email,
            customer_phone,
            // Include UID and AMOUNT directly in the redirect URL so the frontend can credit them if the webhook fails locally
            return_url: `${baseUrl}/payment-callback?status=completed&uid=${uid}&amount=${amount}`,
            cancel_url: `${baseUrl}/payment-callback?status=cancelled`,
            callback_url: `${baseUrl}/api/webhooks/modem-pay`,
            metadata: {
               ...metadata,
               uid, // CRITICAL: Used in webhook to identify user
            },
        });

        console.log('ModemPay payment intent created:', intent?.data?.id);

        return NextResponse.json({
            success: true,
            id: intent.data?.id,
            reference: intent.data?.id,
            checkoutUrl: intent.data?.payment_link, // Needed for frontend redirect
            amount: intent.data?.amount || amount,
            currency: intent.data?.currency || currency,
            status: intent.data?.status || 'pending',
        });
    } catch (error: unknown) {
        console.error('Payment creation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
