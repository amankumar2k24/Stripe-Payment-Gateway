import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import dotenv from "dotenv";
import { parseStripeDate, response, serverError } from "../helpers/response";
import { productModel } from "../models/product";
import { priceModel } from "../models/price";
import { userModel } from "../models/user";
import { subscriptionModel } from "../models/subscription";
dotenv.config();

const stripe: any = new Stripe(process.env.STRIPE_SECRET_KEY);

// To create subscriptionPlan or product
export const createProduct = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  try {
    let newProduct: any;
    let existingProduct: any = await productModel.findOne({ name: body.name });
    if (existingProduct) return response(res, true, 400, "Product already exists", null);

    newProduct = await stripe.products.create({
      name: body.name,
      description: body.description,
    });

    newProduct = await productModel.create({ ...newProduct });

    return response(res, false, 200, "Order created successfully", newProduct);

  } catch (error) {
    serverError(res, error);
  }
};

// To create Price for particular product
export const createPrice = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  try {
    const productDoc = await productModel.findOne({ _id: body.productId });

    const stripePrice = await stripe.prices.create({
      currency: body.currency,
      product: productDoc.id,
      recurring: {
        interval: body.interval,
      },
      unit_amount: body.unitAmount,
    });

    const newPrice = await priceModel.create({ ...stripePrice, product: productDoc._id });

    return response(res, false, 200, "Order captured successfully", newPrice);
  } catch (error) {
    serverError(res, error);
  }
};

export const paymentLink = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.body;
  try {
    const retrievePriceId = await priceModel.findOne({ id: id });
    if (!retrievePriceId) return response(res, true, 400, "Price not found", null);

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: retrievePriceId.id,
          quantity: 1,
        },
      ],
    });

    return response(res, false, 200, "Payment link created successfully", paymentLink);
  } catch (error) {
    serverError(res, error);
  }
};

export const checkoutSession = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  try {
    const retrieveCustomerName = await userModel.findOne({ _id: body.userId });
    if (!retrieveCustomerName) { return response(res, true, 400, "User not found", null); }
    const retrievePrice = await priceModel.findOne({ _id: body.priceId });
    if (!retrievePrice) { return response(res, true, 400, "Price not found", null); }

    const paymentLink = await stripe.checkout.sessions.create({
      customer: retrieveCustomerName.customerId,
      client_reference_id: retrieveCustomerName.customerId,
      line_items: [
        {
          price: retrievePrice.id,
          quantity: 1,
        },
      ],
      payment_method_types: ["card"],  // card, amazon_pay, cashapp, link
      mode: body.mode,
      // shipping_options: [
      //   { shipping_rate_: { "shr_4uE935kD9nskdnDdf" } }          // if want to add shipping rate then you can add generated shippinig rate id here
      // ],
      success_url: `https://logo-design-maker.vercel.app/`,       //if payment success it will redirect you to the success_url link
      cancel_url: `https://logo-design-maker.vercel.app/cancel_url`,
    });

    return response(res, false, 200, "Payment link created successfully", paymentLink);
  } catch (error) {
    serverError(res, error);
  }
};

export const createSubscription = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  // const user: any = req.headers.user;
  // const customerId = user.customerId;
  try {
    // 1. Create test payment method
    // 2. Attach to customer
    await stripe.paymentMethods.attach(body.paymentMethodId, {
      customer: body.customerId,
    });

    // 2. Set default payment method
    await stripe.customers.update(body.customerId, {
      invoice_settings: {
        default_payment_method: body.paymentMethodId,
      },
    });

    // 3. Create subscription
    const subscriptionForUser = await stripe.subscriptions.create({
      customer: body.customerId,
      items: [{ price: body.priceId, },],
      // trial_period_days: 7, // optional
    });
    res.status(200).json({ subscription: subscriptionForUser });

  } catch (error) {
    serverError(res, error);
  }
};

export const webhook = async (req: Request, res: Response): Promise<any> => {
  const sig = req.headers["stripe-signature"];
  if (!sig || Array.isArray(sig)) {
    console.error("Missing or invalid Stripe signature");
    return res.status(400).send("Webhook Error: Invalid signature");
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_ENDPOINT_SECRET as string);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const log = (msg: string) => console.log(`===> ${event.type}: ${msg}`);

  try {
    switch (event.type) {
      case "payment_method.attached": {
        const { id, customer } = event.data.object as any;
        log(`Payment method ${id} attached to customer ${customer}`);
        break;
      }

      case "payment_intent.created": {
        const { id, customer } = event.data.object as any;
        log(`Payment intent ${id} created for customer ${customer}`);
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as any;
        log(`PaymentIntent ${intent.id} succeeded for customer ${intent.customer}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const { last_payment_error } = event.data.object as any;
        log(`Payment failed: ${last_payment_error?.message}`);
        break;
      }

      case "invoice.created": {
        const { id, customer } = event.data.object as any;
        log(`Invoice ${id} created for customer ${customer}`);
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as any;
        log(`Invoice ${invoice.id} finalized for customer ${invoice.customer}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        log(`Invoice ${invoice.id} paid`);

        if (!subscriptionId) return;

        const subscription = await subscriptionModel.findOne({ subscription: subscriptionId });
        if (subscription) {
          subscription.paymentStatus = "paid";
          subscription.subscriptionExpiresAt = parseStripeDate(invoice.lines?.data?.[0]?.period?.end);
          await subscription.save();
          log(`Updated subscription ${subscriptionId} to paid`);
        } else {
          console.warn(`Subscription not found for ID: ${subscriptionId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        log(`Invoice ${invoice.id} payment succeeded for customer ${invoice.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const { last_payment_error } = event.data.object as any;
        log(`Invoice payment failed: ${last_payment_error?.message}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        console.log("sub =>", sub)
        const user = await userModel.findOne({ customerId: sub.customer });
        if (!user) {
          console.warn(`User not found for customer: ${sub.customer}`);
          break;
        }

        const existingSub = await subscriptionModel.findOne({ subscription: sub.id });

        const subExpires = sub?.items?.data[0].current_period_end ? parseStripeDate(sub?.items?.data[0].current_period_end) : null;

        if (event.type === "customer.subscription.created" && !existingSub) {
          await subscriptionModel.create({
            userId: user._id,
            subscription: sub.id,
            paymentStatus: sub.status,
            subscriptionExpiresAt: subExpires,
            webhook: event,
          });
          log(`Created subscription for user ${user._id}`);
        } else if (existingSub) {
          existingSub.paymentStatus = sub.status;
          if (subExpires) existingSub.subscriptionExpiresAt = subExpires;
          await existingSub.save();
          log(`Updated subscription ${sub.id}`);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as any;
        const user = await userModel.findOne({ customerId: session.customer });

        if (!user) {
          console.warn(`User not found for session customer: ${session.customer}`);
          break;
        }

        await subscriptionModel.create({
          userId: user._id,
          checkoutSession: session.id,
          invoice: session.invoice,
          subscription: session.subscription,
          mode: session.mode,
          paymentStatus: session.payment_status,
          subscriptionExpiresAt: parseStripeDate(session.expires_at),
          webhook: event,
        });
        log(`Created subscription from checkout session for user ${user._id}`);
        break;
      }
      case "customer.created": {
        const customer = event.data.object as any;
        log(`Customer ${customer.id} created`);
        break;
      }
      case "customer.updated": {
        const customer = event.data.object as any;
        log(`Customer ${customer.id} updated`);
        break;
      }
      

      default:
        log(`Unhandled event type: ${event.type}`);
        break;
    }


    res.status(200).send("Webhook processed");
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const getAllWebhooksList = async (req: Request, res: Response): Promise<any> => {
  try {
    const webhooks = await stripe.webhookEndpoints.list();

    return res.json(webhooks.data);
  } catch (error) {
    console.error("Error retrieving webhooks:", error);
    serverError(res, error);
  }
}
