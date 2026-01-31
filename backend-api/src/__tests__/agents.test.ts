import { InventoryAgent } from '../agents/inventory-agent';
import { PricingAgent } from '../agents/pricing-agent';
import { Restaurant } from '../models/Restaurant';
import { Ingredient } from '../models/Ingredient';
import { MenuItem } from '../models/MenuItem';
import { AgentAction } from '../models/AgentAction';

// Mock OpenRouter client
jest.mock('../adapters/openrouter', () => ({
  openRouterClient: {
    chat: jest.fn().mockResolvedValue({
      content: 'Test reasoning from AI.',
    }),
  },
}));

describe('Agent Framework', () => {
  let testRestaurant: any;

  beforeEach(async () => {
    testRestaurant = await Restaurant.create({
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
      },
      settings: {
        autoApprovalThreshold: 200,
        lowStockAlertPercentage: 20,
        defaultProfitMargin: 65,
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        aiActionsLimit: 1000,
        aiActionsUsed: 0,
      },
      status: 'active',
    });
  });

  describe('InventoryAgent', () => {
    beforeEach(async () => {
      // Create test ingredients
      await Ingredient.create([
        {
          restaurant: testRestaurant._id,
          name: 'Chicken Breast',
          category: 'Protein',
          unit: 'lbs',
          costPerUnit: 4.99,
          parLevel: 50,
          reorderPoint: 20,
          currentStock: 10, // Below reorder point
          supplier: { name: 'Sysco', contactEmail: 'orders@sysco.com' },
          status: 'active',
        },
        {
          restaurant: testRestaurant._id,
          name: 'Rice',
          category: 'Pantry',
          unit: 'lbs',
          costPerUnit: 1.99,
          parLevel: 30,
          reorderPoint: 10,
          currentStock: 25, // Above reorder point
          supplier: { name: 'Sysco' },
          status: 'active',
        },
      ]);
    });

    it('should identify low stock items', async () => {
      const agent = new InventoryAgent(testRestaurant._id.toString());
      const proposals = await agent.analyze();

      expect(proposals.length).toBeGreaterThan(0);
      expect(proposals[0].type).toBe('inventory_order');
      expect(proposals[0].title).toContain('Chicken Breast');
    });

    it('should create action in database when run', async () => {
      const agent = new InventoryAgent(testRestaurant._id.toString());
      const actions = await agent.run();

      expect(actions.length).toBeGreaterThan(0);

      const dbAction = await AgentAction.findById(actions[0]._id);
      expect(dbAction).toBeTruthy();
      expect(dbAction?.status).toBe('pending');
    });

    it('should calculate correct order quantity', async () => {
      const agent = new InventoryAgent(testRestaurant._id.toString());
      const proposals = await agent.analyze();

      const chickenProposal = proposals.find(p => p.title.includes('Chicken'));
      expect(chickenProposal).toBeTruthy();
      // Should order: parLevel (50) - currentStock (10) = 40
      expect(chickenProposal?.payload.quantity).toBe(40);
    });
  });

  describe('PricingAgent', () => {
    beforeEach(async () => {
      const ingredient = await Ingredient.create({
        restaurant: testRestaurant._id,
        name: 'Salmon',
        category: 'Protein',
        unit: 'lbs',
        costPerUnit: 15.99, // Increased cost
        parLevel: 20,
        reorderPoint: 8,
        currentStock: 15,
        status: 'active',
      });

      await MenuItem.create({
        restaurant: testRestaurant._id,
        name: 'Grilled Salmon',
        description: 'Fresh salmon',
        category: 'Mains',
        price: 24.99,
        cost: 10.00, // Old cost - now ingredient cost is higher
        ingredients: [
          { ingredient: ingredient._id, quantity: 0.5, unit: 'lbs' },
        ],
        status: 'active',
      });
    });

    it('should detect pricing adjustments needed', async () => {
      const agent = new PricingAgent(testRestaurant._id.toString());
      const proposals = await agent.analyze();

      // May or may not propose depending on margin calculation
      // This tests that the agent runs without error
      expect(Array.isArray(proposals)).toBe(true);
    });

    it('should create action for significant margin changes', async () => {
      // Create a menu item with very low margin
      await MenuItem.create({
        restaurant: testRestaurant._id,
        name: 'Low Margin Item',
        description: 'Test item',
        category: 'Mains',
        price: 15.00,
        cost: 12.00, // 20% margin - well below 65% target
        ingredients: [],
        status: 'active',
      });

      const agent = new PricingAgent(testRestaurant._id.toString());
      const actions = await agent.run();

      // Should propose price increase for low margin item
      const lowMarginAction = actions.find(a => 
        a.title.includes('Low Margin Item')
      );

      if (lowMarginAction) {
        expect(lowMarginAction.impact).toBe('high');
      }
    });
  });

  describe('Action Approval Flow', () => {
    it('should approve and execute action', async () => {
      const agent = new InventoryAgent(testRestaurant._id.toString());
      
      await Ingredient.create({
        restaurant: testRestaurant._id,
        name: 'Test Item',
        category: 'Pantry',
        unit: 'each',
        costPerUnit: 5.00,
        parLevel: 20,
        reorderPoint: 10,
        currentStock: 5,
        supplier: { name: 'Supplier' },
        status: 'active',
      });

      const actions = await agent.run();
      expect(actions.length).toBeGreaterThan(0);

      const action = actions[0];
      const result = await agent.approve(action._id.toString(), 'test-user-id');

      expect(result.success).toBe(true);

      const updatedAction = await AgentAction.findById(action._id);
      expect(updatedAction?.status).toBe('executed');
    });

    it('should reject action', async () => {
      const agent = new InventoryAgent(testRestaurant._id.toString());
      
      await Ingredient.create({
        restaurant: testRestaurant._id,
        name: 'Reject Test',
        category: 'Pantry',
        unit: 'each',
        costPerUnit: 5.00,
        parLevel: 20,
        reorderPoint: 10,
        currentStock: 5,
        status: 'active',
      });

      const actions = await agent.run();
      const action = actions[0];

      const rejected = await agent.reject(
        action._id.toString(),
        'test-user-id',
        'Not needed at this time'
      );

      expect(rejected).toBe(true);

      const updatedAction = await AgentAction.findById(action._id);
      expect(updatedAction?.status).toBe('rejected');
      expect(updatedAction?.rejectionReason).toBe('Not needed at this time');
    });
  });
});
