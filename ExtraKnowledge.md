1.	Thin Payload & Snapshot Payload
🧠 Summary
Feature	             Thin Payload	                    Snapshot Payload
Data included	     Only ID + metadata	                Full object
Extra API calls?	 ✅ Required	                      ❌ Not needed
Faster?	             ✅ Slightly                       ❌ Slightly larger
Easier for devs?	 ❌ Needs fetching	              ✅ Immediate access

2.	Always use /webhook endpoint in main entry point of NodeJs
•	The /webhook route gets the raw body, as Stripe expects.
•	All your other routes can still use express.json() normally.
________________________________________
🧪 Tip: Never apply express.json() globally before the Stripe webhook.
________________________________________
Summary:
Question	                                                                Answer
Do I need to apply /webhook before express.json()?	                        ✅ Yes
Why?                                                                    	To preserve the raw body for Stripe’s signature check
What happens if I don’t?	                                                ❌ Signature verification fails – 400 errors
	

3.	When trial end (trial_period_days should be include while subscription creation is best approach)
Handle Webhooks=>
Set up webhook for events like:
•	invoice.paid
•	invoice.payment_failed
•	customer.subscription.trial_will_end
•	customer.subscription.deleted
Use this to update user access (e.g., lock premium features if subscription fails).

Why set trial_period_days during subscription creation?
Because trial periods are user-specific. Some users might get a 7-day trial, others none — and you can’t change this once it's baked into the price object.
________________________________________
✅ Final Answer:
👉 Use this during stripe.subscriptions.create(), not products.create() or prices.create().

