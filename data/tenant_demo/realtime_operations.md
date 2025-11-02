# Real-Time Operations Guide

## Restaurant: Burger Queen
**Location:** 370 Lexington Avenue, NYC  
**Hours:** 10:00 AM - 10:00 PM Daily  
**Concept:** Fast-casual burger joint with delivery

---

## Data Sources

### Orders (orders_realtime.csv)
- **Tracks:** All incoming orders with timestamps
- **Channels:** In-person, DoorDash, UberEats, Pickup
- **Metrics:** Order ID, items, quantity, price, prep time, delivery time
- **Usage:** Real-time demand tracking, revenue monitoring

### Customer Reviews (customer_reviews.csv)
- **Tracks:** Customer feedback across all platforms
- **Sentiment:** Positive, neutral, negative
- **Keywords:** Fresh, spicy, cold, late, etc.
- **Usage:** Quality control, menu improvements, service issues

### Inventory (inventory.csv)
- **Tracks:** All ingredient stock levels
- **Par Levels:** Target stock quantities
- **Suppliers:** US Foods, Sysco, Fresh Direct
- **Usage:** Reordering triggers, cost tracking, waste prevention

### Staff Schedule (staff_schedule.csv)
- **Tracks:** Employee shifts and availability
- **Roles:** Cooks, Cashiers
- **Rates:** $22/hr (cooks), $16.50/hr (cashiers)
- **Usage:** Labor cost optimization, coverage planning

---

## Key Operational Patterns

### Peak Hours
- **Lunch Rush:** 12:00 PM - 2:00 PM (40 orders/hour)
- **Dinner Rush:** 6:00 PM - 8:00 PM (50 orders/hour)
- **Weekend Boost:** +30% on Saturdays and Sundays

### Common Issues from Reviews
1. **"Food arrived cold"** - Delivery timing issues
2. **"Too spicy"** - Consider milder default seasoning
3. **"Incomplete order"** - Better QA before dispatch
4. **"Slow delivery"** - Third-party delivery delays

### Inventory Reorder Triggers
- **Beef Patties:** Below 500 lbs (2-day lead time)
- **Buns:** Below 800 units (1-day lead time)
- **Fresh Produce:** Below par level (order daily from Fresh Direct)
- **Frozen Items:** Below 250 lbs (3-day lead time)

### Staffing Guidelines
- **Lunch (10 AM - 2 PM):** 2 cooks, 1 cashier
- **Afternoon (2 PM - 6 PM):** 1 cook, 1 cashier
- **Dinner (6 PM - 10 PM):** 2-3 cooks, 2 cashiers
- **Capacity:** Each cook handles 25 orders/hour

---

## Answer Guidelines for AI

When answering questions:
1. **Check CSV data first** for real-time numbers
2. **Cite specific records** (e.g., "Based on today's orders...")
3. **Calculate metrics** (revenue, averages, forecasts)
4. **Identify trends** (channel mix, sentiment patterns)
5. **Suggest actions** (reorder items, adjust staffing)

### Example Responses

**Q: How are we doing today?**
A: "Based on orders_realtime.csv, we've filled 30 orders totaling $555.50 as of 2:00 PM. We're tracking 12% ahead of yesterday. Channel breakdown: 50% in-person, 27% DoorDash, 17% pickup, 7% UberEats."

**Q: Any inventory concerns?**
A: "According to inventory.csv, we have 3 items below par level: Lettuce (25/40), Onions (40/60), Pickles (15/20). I recommend placing a Fresh Direct order today to restock produce."

**Q: What are customers saying?**
A: "Recent reviews (customer_reviews.csv) show a 4.2/5 average. Positive feedback mentions 'fresh' and 'cheesy' burgers. Negative reviews cite 'cold delivery' (2 mentions) and 'too spicy' (3 mentions). Consider adjusting default spice level."

**Q: Who's working today?**
A: "From staff_schedule.csv: Alice Johnson (Cook, 10-6), Bob Martinez (Cook, 12-8), Carol Smith (Cashier, 10-6), Dave Wilson (Cashier, 4-10). Total labor cost today: $528."

---

## Integration with LSTM Forecasting

The real-time CSV data feeds into our LSTM model:
- **Historical orders** → Training data
- **Current trends** → Feature engineering
- **Weather patterns** → External factors
- **Day/time patterns** → Seasonality

This enables accurate hour-by-hour demand forecasting and proactive operations planning.

---

**Remember:** Always reference actual CSV data when answering operational questions. This ensures responses are grounded in real restaurant performance, not generic assumptions.

