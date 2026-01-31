export { BaseAgent, AgentConfig, ActionProposal, ExecutionResult } from './base-agent';
export { InventoryAgent } from './inventory-agent';
export { PricingAgent } from './pricing-agent';
export { agentScheduler } from './scheduler';

// Agent factory for creating agents by type
import { BaseAgent } from './base-agent';
import { InventoryAgent } from './inventory-agent';
import { PricingAgent } from './pricing-agent';

export type AgentType = 'inventory' | 'pricing';

export function createAgent(type: AgentType, restaurantId: string): BaseAgent {
  switch (type) {
    case 'inventory':
      return new InventoryAgent(restaurantId);
    case 'pricing':
      return new PricingAgent(restaurantId);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

// Get all available agent types
export function getAvailableAgents(): { type: AgentType; name: string; description: string }[] {
  return [
    {
      type: 'inventory',
      name: 'Inventory Agent',
      description: 'Monitors inventory levels and suggests reordering',
    },
    {
      type: 'pricing',
      name: 'Pricing Agent',
      description: 'Analyzes menu pricing based on ingredient costs and profit margins',
    },
  ];
}
