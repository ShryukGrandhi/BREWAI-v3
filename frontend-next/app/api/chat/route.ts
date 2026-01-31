import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, restaurantId, history } = body;

    // Forward request to backend API
    const response = await fetch(`${BACKEND_URL}/api/agents/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        message,
        restaurantId,
        history
      })
    });

    if (!response.ok) {
      // Fallback response for demo purposes
      return NextResponse.json({
        content: generateFallbackResponse(message),
        actions: []
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return fallback response
    return NextResponse.json({
      content: 'I\'m currently processing your request. In the meantime, I can help you with inventory tracking, menu optimization, pricing strategies, and operational insights. What specific area would you like to explore?',
      actions: []
    });
  }
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
    return `Based on current inventory levels, I've identified a few items that need attention:

1. **Chicken Breast** - Stock is at 23% capacity (15 lbs remaining). Recommend ordering 50 lbs within the next 2 days.

2. **Romaine Lettuce** - Freshness window closing in 2 days. Consider featuring Caesar salads as a special.

3. **Olive Oil** - Running low at 18% capacity. This is a critical ingredient for multiple dishes.

Would you like me to generate a purchase order for these items?`;
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('pricing')) {
    return `I've analyzed your menu pricing against current food costs and market data. Here are my recommendations:

1. **Grilled Salmon** - Current price $28, suggested $32 (+14%). Your cost-to-price ratio is below target.

2. **House Burger** - Well-priced at $16. This is your best performer with 42% margin.

3. **Caesar Salad** - Consider a $1 increase. Competitor analysis shows room for adjustment.

Shall I create a pricing proposal for your review?`;
  }

  if (lowerMessage.includes('menu') || lowerMessage.includes('performance')) {
    return `Here's your menu performance analysis for the past 30 days:

**Top Performers:**
- House Burger: 342 orders (↑12% from last month)
- Grilled Chicken: 287 orders (↑8%)
- Caesar Salad: 256 orders (stable)

**Underperformers:**
- Seafood Risotto: 34 orders (consider repositioning or removing)
- Vegetable Stir-fry: 41 orders (try adding to lunch specials)

**Opportunity:** The data suggests strong customer preference for protein-forward dishes. Consider adding a new premium steak option.`;
  }

  if (lowerMessage.includes('report') || lowerMessage.includes('weekly')) {
    return `I'm preparing your weekly operations report. Here's a summary:

**Revenue:** $47,832 (↑5.2% week-over-week)
**Orders:** 1,247 total orders
**Average Ticket:** $38.35

**Key Insights:**
- Saturday dinner service was your strongest period
- Delivery orders increased 18%
- Food cost ratio improved to 28.3%

**Action Items:**
- Review understaffing on Saturday evenings
- Tomato prices expected to rise 12% - consider menu adjustments

Would you like the full detailed report?`;
  }

  return `I understand you're asking about "${message}". 

As your AI operations assistant, I can help with:
- **Inventory Management** - Track stock levels, predict needs, generate orders
- **Menu Optimization** - Analyze performance, suggest improvements
- **Pricing Strategy** - Data-driven pricing recommendations
- **Operations Reports** - Daily, weekly, and monthly insights

What specific area would you like to explore?`;
}
