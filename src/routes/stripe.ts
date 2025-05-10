import express, { Router } from "express";
const stripeRouter = Router();

import { verifyJwt } from "../helpers/verifyJWT";
import { createProduct, createPrice, paymentLink, checkoutSession, getAllWebhooksList, createSubscription } from "../controllers/stripe";

stripeRouter.post("/create-product", createProduct);
stripeRouter.post("/create-price", createPrice);
stripeRouter.post("/create-payment-link", paymentLink);
stripeRouter.post("/create-checkout-session", checkoutSession);
stripeRouter.post("/create-subscription", createSubscription);
stripeRouter.get("/get-webhooks-list", getAllWebhooksList);

export { stripeRouter };
