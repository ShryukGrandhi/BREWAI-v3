import { BaseAgent, AgentConfig, ActionProposal, ExecutionResult } from './base-agent';
import { Ingredient } from '../models/Ingredient';
import { AgentActionDocument } from '../models/AgentAction';
import logger from '../utils/logger';

const config: AgentConfig = {
  name: 'inventory',
  description: 'Monitors inventory levels and suggests reordering',
  version: '1.0.0',
  capabilities: [
    'monitor_stock_levels',
    'suggest_reorders',
    'calculate_order_quantities',
    'predict_stockouts',
  ],
  autoApprovalThreshold: 200,
  maxConfidenceForAutoApproval: 95,
};

interface InventoryAnalysis {
  ingredient: any;
  daysUntilStockout: number;
  suggestedOrderQty: number;
  orderValue: number;
  urgency: 'critical' | 'low' | 'normal';
}

export class InventoryAgent extends BaseAgent {
  constructor(restaurantId: string) {
    super(config, restaurantId);
  }

  async analyze(): Promise<ActionProposal[]> {
    const proposals: ActionProposal[] = [];

    // Get all active ingredients with low stock
    const ingredients = await Ingredient.find({
      restaurant: this.restaurantId,
      status: 'active',
    });

    for (const ingredient of ingredients) {
      const analysis = await this.analyzeIngredient(ingredient);
      
      if (analysis.urgency !== 'normal') {
        const proposal = await this.createOrderProposal(analysis);
        proposals.push(proposal);
      }
    }

    // Sort by urgency - critical first
    proposals.sort((a, b) => {
      const urgencyOrder = { critical: 0, low: 1, normal: 2 };
      const aUrgency = a.metadata?.urgency as string || 'normal';
      const bUrgency = b.metadata?.urgency as string || 'normal';
      return urgencyOrder[aUrgency as keyof typeof urgencyOrder] - urgencyOrder[bUrgency as keyof typeof urgencyOrder];
    });

    return proposals;
  }

  private async analyzeIngredient(ingredient: any): Promise<InventoryAnalysis> {
    const currentStock = ingredient.currentStock;
    const parLevel = ingredient.parLevel;
    const reorderPoint = ingredient.reorderPoint;
    const costPerUnit = ingredient.costPerUnit;

    // Calculate days until stockout (assuming average daily usage)
    // This would ideally use historical data
    const avgDailyUsage = parLevel / 7; // Assume par level covers a week
    const daysUntilStockout = avgDailyUsage > 0 ? currentStock / avgDailyUsage : 999;

    // Calculate suggested order quantity
    const suggestedOrderQty = Math.max(0, parLevel - currentStock);
    const orderValue = suggestedOrderQty * costPerUnit;

    // Determine urgency
    let urgency: 'critical' | 'low' | 'normal' = 'normal';
    if (currentStock <= reorderPoint * 0.5) {
      urgency = 'critical';
    } else if (currentStock <= reorderPoint) {
      urgency = 'low';
    }

    return {
      ingredient,
      daysUntilStockout,
      suggestedOrderQty,
      orderValue,
      urgency,
    };
  }

  private async createOrderProposal(analysis: InventoryAnalysis): Promise<ActionProposal> {
    const { ingredient, daysUntilStockout, suggestedOrderQty, orderValue, urgency } = analysis;

    const context = `
      Ingredient: ${ingredient.name}
      Current Stock: ${ingredient.currentStock} ${ingredient.unit}
      Par Level: ${ingredient.parLevel} ${ingredient.unit}
      Reorder Point: ${ingredient.reorderPoint} ${ingredient.unit}
      Days Until Stockout: ${Math.round(daysUntilStockout)}
      Supplier: ${ingredient.supplier?.name || 'Unknown'}
    `;

    const decision = `Order ${suggestedOrderQty} ${ingredient.unit} of ${ingredient.name} from ${ingredient.supplier?.name || 'supplier'} for estimated cost of $${orderValue.toFixed(2)}.`;

    const reasoning = await this.generateReasoning(context, decision);

    // Calculate confidence based on data quality
    let confidence = 85;
    if (ingredient.supplier?.name) confidence += 5;
    if (urgency === 'critical') confidence += 5;
    if (daysUntilStockout < 2) confidence += 5;

    return {
      type: 'inventory_order',
      title: `Auto-order ${ingredient.name}`,
      description: `Stock is at ${ingredient.currentStock} ${ingredient.unit}, below the reorder point of ${ingredient.reorderPoint} ${ingredient.unit}. Recommended order: ${suggestedOrderQty} ${ingredient.unit} from ${ingredient.supplier?.name || 'supplier'}.`,
      reasoning,
      confidence: Math.min(confidence, 99),
      impact: urgency === 'critical' ? 'high' : urgency === 'low' ? 'medium' : 'low',
      estimatedValue: orderValue,
      metadata: {
        urgency,
        daysUntilStockout: Math.round(daysUntilStockout),
        ingredientId: ingredient._id,
      },
      payload: {
        ingredientId: ingredient._id.toString(),
        ingredientName: ingredient.name,
        quantity: suggestedOrderQty,
        unit: ingredient.unit,
        supplier: ingredient.supplier,
        estimatedCost: orderValue,
      },
    };
  }

  async execute(action: AgentActionDocument): Promise<ExecutionResult> {
    try {
      const { ingredientId, quantity, supplier } = action.payload as any;

      // In a real implementation, this would:
      // 1. Create a purchase order in the system
      // 2. Send order to supplier via API/email
      // 3. Update expected delivery date
      
      logger.info(`Executing inventory order for ingredient ${ingredientId}`, {
        quantity,
        supplier: supplier?.name,
      });

      // Simulate order creation
      const orderId = `PO-${Date.now()}`;

      // Update ingredient with pending order
      await Ingredient.findByIdAndUpdate(ingredientId, {
        $push: {
          pendingOrders: {
            orderId,
            quantity,
            orderedAt: new Date(),
            expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
            status: 'ordered',
          },
        },
        lastOrderedAt: new Date(),
      });

      return {
        success: true,
        data: {
          orderId,
          message: `Order ${orderId} placed successfully`,
          expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    } catch (error) {
      logger.error('Inventory order execution failed:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

export default InventoryAgent;
