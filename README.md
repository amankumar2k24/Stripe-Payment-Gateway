🌟 Stripe Subscription Flow
To implement a seamless subscription-based payment system using Stripe, follow these steps:

1. 📦 Create a Product
Define your product or subscription plan in Stripe using stripe.products.create(). This represents the offering you want to charge your users for, like a subscription plan.

2. 💸 Create a Price
Set up pricing for the product using stripe.prices.create(). Specify the price, currency, and billing intervals (e.g., monthly, yearly, or custom durations).

3. 👤 Create a Customer
Register the customer in Stripe using stripe.customers.create(). This allows you to associate payments and subscriptions with a specific user.

4. 🛒 Create a Checkout Session
Generate a session for the customer to complete their payment securely using stripe.checkout.sessions.create(). This session provides a payment link for the customer.

5. 🔄 Create a Subscription
After payment completion, create a subscription using stripe.subscriptions.create(). This sets up a recurring billing schedule based on the selected product’s price and billing interval.

6. 📬 Handle Webhooks
Set up Stripe webhooks to listen for important events like checkout.session.completed or customer.subscription.created. This ensures real-time updates to your system, allowing you to track subscription status changes.


Note:- 1. While setting webhook on Stripe GUi - we need to enter the frontend URL/endPointOfWebhook which will be used to send the data to the backend.
       2. To run ngrok - https://ngrok.com/    - i have created an account with amanfrontdev@gmail.com and password as Amankumar@123
       3. To run ngrok - open cmd and then run command - ngrok http 8000     ;here,8000  is PORT 