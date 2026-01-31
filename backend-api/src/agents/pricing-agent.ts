import { BaseAgent, AgentConfig, ActionProposal, ExecutionResult } from './base-agent';
import { MenuItem } from '../models/MenuItem';
import { Ingredient } from '../models/Ingredient';
import { AgentActionDocument } from '../models/AgentAction';
import logger from '../utils/logger';

const config: AgentConfig = {
  name: 'pricing',
  description: 'Analyzes menu pricing based on ingredient costs and profit margins',
  version: '1.0.0',
  capabilities: [
    'analyze_profit_margins',
    'suggest_price_changes',
    'track_cost_changes',
    'optimize_menu_pricing',
  ],
  maxConfidenceForAutoApproval: 90,
};

interface MenuItemAnalysis {
  menuItem: any;
  currentMargin: number;
  targetMargin: number;
  marginDelta: number;
  suggestedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  costIncrease: number;
}

export class PricingAgent extends BaseAgent {
  private targetMargin = 65; // Default 65% profit margin

  constructor(restaurantId: string) {
    super(config, restaurantId);
  }

  async analyze(): Promise<ActionProposal[]> {
    const proposals: ActionProposal[] = [];

    // Get all active menu items
    const menuItems = await MenuItem.find({
      restaurant: this.restaurantId,
      status: 'active',
    }).populate('ingredients.ingredient');

    for (const item of menuItems) {
      const analysis = await this.analyzeMenuItem(item);
      
      if (analysis && Math.abs(analysis.marginDelta) > 5) {
        const proposal = await this.createPriceChangeProposal(analysis);
        proposals.push(proposal);
      }
    }

    return proposals;
  }

  private async analyzeMenuItem(menuItem: any): Promise<MenuItemAnalysis | null> {
    // Calculate current cost based on ingredients
    let calculatedCost = 0;
    
    if (menuItem.ingredients && menuItem.ingredients.length > 0) {
      for (const ing of menuItem.ingredients) {
        if (ing.ingredient) {
          calculatedCost += ing.quantity * ing.ingredient.costPerUnit;
        }
      }
    } else {
      // Use stored cost if no ingredients linked
      calculatedCost = menuItem.cost || 0;
    }

    if (calculatedCost === 0) {
      return null;
    }

    const currentPrice = menuItem.price;
    const currentMargin = ((currentPrice - calculatedCost) / currentPrice) * 100;
    const targetMargin = this.targetMargin;
    const marginDelta = currentMargin - targetMargin;

    // Calculate suggested price to meet target margin
    const suggestedPrice = calculatedCost / (1 - targetMargin / 100);
    const priceChange = suggestedPrice - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;

    // Detect if cost increased
    const storedCost = menuItem.cost || 0;
    const costIncrease = calculatedCost > storedCost ? 
      ((calculatedCost - storedCost) / storedCost) * 100 : 0;

    return {
      menuItem,
      currentMargin,
      targetMargin,
      marginDelta,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      priceChange,
      priceChangePercent,
      costIncrease,
    };
  }

  private async createPriceChangeProposal(analysis: MenuItemAnalysis): Promise<ActionProposal> {
    const { menuItem, currentMargin, suggestedPrice, priceChange, priceChangePercent, costIncrease } = analysis;

    const context = `
      Menu Item: ${menuItem.name}
      Current Price: $${menuItem.price.toFixed(2)}
      Current Cost: $${menuItem.cost?.toFixed(2) || 'N/A'}
      Current Margin: ${currentMargin.toFixed(1)}%
      Target Margin: ${this.targetMargin}%
      ${costIncrease > 0 ? `Ingredient cost increased: ${costIncrease.toFixed(1)}%` : ''}
    `;

    const decision = `Update price from $${menuItem.price.toFixed(2)} to $${suggestedPrice.toFixed(2)} (${priceChange > 0 ? '+' : ''}$${priceChange.toFixed(2)}, ${priceChangePercent.toFixed(1)}% change).`;

    const reasoning = await this.generateReasoning(context, decision);

    // Determine impact and confidence
    const absChangePercent = Math.abs(priceChangePercent);
    let impact: 'low' | 'medium' | 'high' = 'low';
    let confidence = 80;

    if (absChangePercent > 15) {
      impact = 'high';
      confidence = 75;
    } else if (absChangePercent > 8) {
      impact = 'medium';
      confidence = 85;
    } else {
      impact = 'low';
      confidence = 90;
    }

    // Higher confidence if cost increase is significant
    if (costIncrease > 10) {
      confidence += 5;
    }

    return {
      type: 'price_update',
      title: `Update ${menuItem.name} price`,
      description: costIncrease > 0 
        ? `Ingredient cost increased ${costIncrease.toFixed(0)}%. Suggested new price: $${suggestedPrice.toFixed(2)} (${priceChange > 0 ? '+' : ''}$${priceChange.toFixed(2)})`
        : `Current margin (${currentMargin.toFixed(0)}%) is ${currentMargin < this.targetMargin ? 'below' : 'above'} target. Suggested price: $${suggestedPrice.toFixed(2)}`,
      reasoning,
      confidence: Math.min(confidence, 95),
      impact,
      estimatedValue: Math.abs(priceChange) * 50, // Estimate based on 50 orders
      metadata: {
        menuItemId: menuItem._id,
        currentPrice: menuItem.price,
        currentMargin,
        costIncrease,
      },
      payload: {
        menuItemId: menuItem._id.toString(),
        menuItemName: menuItem.name,
        currentPrice: menuItem.price,
        newPrice: suggestedPrice,
        priceChange,
        priceChangePercent,
      },
    };
  }

  async execute(action: AgentActionDocument): Promise<ExecutionResult> {
    try {
      const { menuItemId, newPrice, currentPrice } = action.payload as any;

      // Update menu item price
      const updated = await MenuItem.findByIdAndUpdate(
        menuItemId,
        {
          price: newPrice,
          $push: {
            priceHistory: {
              price: currentPrice,
              changedAt: new Date(),
              reason: 'AI-suggested margin optimization',
            },
          },
        },
        { new: true }
      );

      if (!updated) {
        return {
          success: false,
          error: 'Menu item not found',
        };
      }

      logger.info(`Updated menu item price: ${updated.name}`, {
        oldPrice: currentPrice,
        newPrice,
      });

      return {
        success: true,
        data: {
          menuItemId: updated._id,
          oldPrice: currentPrice,
          newPrice,
          message: `Price updated from $${currentPrice.toFixed(2)} to $${newPrice.toFixed(2)}`,
        },
      };
    } catch (error) {
      logger.error('Price update execution failed:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

export default PricingAgent;
