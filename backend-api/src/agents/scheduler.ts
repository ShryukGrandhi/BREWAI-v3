import cron from 'node-cron';
import { Restaurant } from '../models/Restaurant';
import { InventoryAgent } from './inventory-agent';
import { PricingAgent } from './pricing-agent';
import logger from '../utils/logger';

interface ScheduledTask {
  name: string;
  schedule: string;
  task: cron.ScheduledTask;
}

class AgentScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Agent scheduler is already running');
      return;
    }

    logger.info('Starting agent scheduler...');

    // Schedule inventory check every 4 hours
    this.scheduleTask('inventory-check', '0 */4 * * *', async () => {
      await this.runInventoryAgents();
    });

    // Schedule pricing check every day at 6 AM
    this.scheduleTask('pricing-check', '0 6 * * *', async () => {
      await this.runPricingAgents();
    });

    // Schedule a quick check every hour during business hours (8 AM - 10 PM)
    this.scheduleTask('hourly-check', '0 8-22 * * *', async () => {
      await this.runQuickCheck();
    });

    this.isRunning = true;
    logger.info('Agent scheduler started with tasks:', Array.from(this.tasks.keys()));
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    logger.info('Stopping agent scheduler...');
    
    this.tasks.forEach((task, name) => {
      task.task.stop();
      logger.info(`Stopped task: ${name}`);
    });

    this.tasks.clear();
    this.isRunning = false;
    logger.info('Agent scheduler stopped');
  }

  /**
   * Schedule a new task
   */
  private scheduleTask(name: string, schedule: string, handler: () => Promise<void>): void {
    const task = cron.schedule(schedule, async () => {
      logger.info(`Running scheduled task: ${name}`);
      try {
        await handler();
        logger.info(`Completed scheduled task: ${name}`);
      } catch (error) {
        logger.error(`Task ${name} failed:`, error);
      }
    });

    this.tasks.set(name, { name, schedule, task });
  }

  /**
   * Run inventory agents for all active restaurants
   */
  private async runInventoryAgents(): Promise<void> {
    const restaurants = await Restaurant.find({
      status: 'active',
      'subscription.status': 'active',
    }).select('_id');

    logger.info(`Running inventory agents for ${restaurants.length} restaurants`);

    for (const restaurant of restaurants) {
      try {
        const agent = new InventoryAgent(restaurant._id.toString());
        const actions = await agent.run();
        logger.info(`Inventory agent created ${actions.length} actions`, {
          restaurantId: restaurant._id,
        });
      } catch (error) {
        logger.error(`Inventory agent failed for restaurant ${restaurant._id}:`, error);
      }
    }
  }

  /**
   * Run pricing agents for all active restaurants
   */
  private async runPricingAgents(): Promise<void> {
    const restaurants = await Restaurant.find({
      status: 'active',
      'subscription.status': 'active',
    }).select('_id');

    logger.info(`Running pricing agents for ${restaurants.length} restaurants`);

    for (const restaurant of restaurants) {
      try {
        const agent = new PricingAgent(restaurant._id.toString());
        const actions = await agent.run();
        logger.info(`Pricing agent created ${actions.length} actions`, {
          restaurantId: restaurant._id,
        });
      } catch (error) {
        logger.error(`Pricing agent failed for restaurant ${restaurant._id}:`, error);
      }
    }
  }

  /**
   * Run quick check for critical inventory items
   */
  private async runQuickCheck(): Promise<void> {
    // This is a lighter check that only looks for critical issues
    const restaurants = await Restaurant.find({
      status: 'active',
      'subscription.status': 'active',
    }).select('_id');

    for (const restaurant of restaurants) {
      try {
        const agent = new InventoryAgent(restaurant._id.toString());
        // Only analyze, don't auto-execute
        const proposals = await agent.analyze();
        
        // Filter for critical items only
        const criticalProposals = proposals.filter(
          p => p.metadata?.urgency === 'critical'
        );

        if (criticalProposals.length > 0) {
          logger.warn(`Found ${criticalProposals.length} critical inventory items`, {
            restaurantId: restaurant._id,
          });
        }
      } catch (error) {
        logger.error(`Quick check failed for restaurant ${restaurant._id}:`, error);
      }
    }
  }

  /**
   * Manually trigger agent run for a specific restaurant
   */
  async triggerForRestaurant(restaurantId: string, agentTypes?: string[]): Promise<void> {
    const types = agentTypes || ['inventory', 'pricing'];

    for (const type of types) {
      try {
        let agent;
        switch (type) {
          case 'inventory':
            agent = new InventoryAgent(restaurantId);
            break;
          case 'pricing':
            agent = new PricingAgent(restaurantId);
            break;
          default:
            logger.warn(`Unknown agent type: ${type}`);
            continue;
        }

        const actions = await agent.run();
        logger.info(`Manual trigger: ${type} agent created ${actions.length} actions`, {
          restaurantId,
        });
      } catch (error) {
        logger.error(`Manual trigger failed for ${type} agent:`, error);
        throw error;
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; tasks: { name: string; schedule: string }[] } {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(this.tasks.values()).map(t => ({
        name: t.name,
        schedule: t.schedule,
      })),
    };
  }
}

// Export singleton instance
export const agentScheduler = new AgentScheduler();
export default agentScheduler;
