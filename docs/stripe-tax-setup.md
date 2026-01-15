title: Stripe Payments & Tax Setup
description: Connect Stripe, enable automatic tax, and configure card-on-file features.

# Stripe Payments & Card on File

Use this checklist to turn on payments, tax, and saved cards for services.

## 1) Company Profile (one-time)
1) Go to **Company Profile**.
2) Set **Country** and **Province/State**.
3) Choose **Prices include tax**:
   - Off = tax added on top at checkout.
   - On = tax included in the listed price.

## 2) Connect Stripe (one-time)
1) Go to **Advanced Management -> Settings -> Stripe Hub**.
2) Click **Connect Stripe** and finish onboarding.
3) Wait until the status says **Ready to accept payments**.

## 3) Enable Automatic Tax in Stripe
1) Click **Open Stripe Dashboard**.
2) Go to **Tax -> Overview** and switch **Automatic tax** to **On**.
3) In **Business information**, set your **Origin address**.
4) In **Products & prices**, pick a default tax category:
   - Start with **General — Services** (refine later per product).
5) Choose **Include tax in prices**:
   - No if you want tax added on top (common in US/CA).
   - Yes if your prices already include tax.

## 4) Tax registrations
1) Go to **Tax -> Registrations**.
2) Add your home region (province/state).
3) Add other regions only when you are registered or Stripe notifies you that a threshold is met.
4) Turn on **Thresholds monitoring** so Stripe alerts you as you grow.

## Card on file (optional)
1) Go to **Advanced Management -> Settings -> Checkout**.
2) Enable **Card on file** so clients can store a payment method.
3) Use this for no-show fees or future charges.

## FAQs
**Do I need US registration to sell to US customers?**  
Only if you meet a state threshold or choose to register there. Start with your home region.

**Does Stripe handle receipts?**  
Yes. Receipts are issued in your business name.

**What about cross-border orders?**  
Tax depends on the buyer’s location and where you are registered. If you are not registered, Stripe will not collect there.
