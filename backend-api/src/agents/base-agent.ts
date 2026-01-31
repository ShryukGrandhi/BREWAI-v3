import { AgentAction, AgentActionDocument, ActionStatus } from '../models/AgentAction';
import { Restaurant } from '../models/Restaurant';
import { openRouterClient } from '../adapters/openrouter';
import logger from '../utils/logger';
import { EventEmitter } from 'events';

export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  autoApprovalThreshold?: number;
  maxConfidenceForAutoApproval?: number;
}

export interface ActionProposal {
  type: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  estimatedValue?: number;
  metadata?: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected restaurantId: string;

  constructor(config: AgentConfig, restaurantId: string) {
    super();
    this.config = config;
    this.restaurantId = restaurantId;
  }

  get name(): string {
    return this.config.name;
  }

  get capabilities(): string[] {
    return this.config.capabilities;
  }

  /**
   * Analyze current state and propose actions
   * Must be implemented by each agent type
   */
  abstract analyze(): Promise<ActionProposal[]>;

  /**
   * Execute an approved action
   * Must be implemented by each agent type
   */
  abstract execute(action: AgentActionDocument): Promise<ExecutionResult>;

  /**
   * Run the agent's analysis and create action proposals
   */
  async run(): Promise<AgentActionDocument[]> {
    try {
      logger.info(`Running agent: ${this.config.name}`, { restaurantId: this.restaurantId });

      const proposals = await this.analyze();
      const createdActions: AgentActionDocument[] = [];

      for (const proposal of proposals) {
        const action = await this.createAction(proposal);
        createdActions.push(action);

        // Check for auto-approval
        if (await this.shouldAutoApprove(action)) {
          await this.autoApprove(action);
        }
      }

      this.emit('analysis-complete', { agent: this.config.name, actions: createdActions });
      return createdActions;
    } catch (error) {
      logger.error(`Agent ${this.config.name} run failed:`, error);
      this.emit('error', { agent: this.config.name, error });
      throw error;
    }
  }

  /**
   * Create an action in the database
   */
  protected async createAction(proposal: ActionProposal): Promise<AgentActionDocument> {
    const action = new AgentAction({
      restaurant: this.restaurantId,
      agentType: this.config.name,
      agentVersion: this.config.version,
      type: proposal.type,
      title: proposal.title,
      description: proposal.description,
      reasoning: proposal.reasoning,
      confidence: proposal.confidence,
      impact: proposal.impact,
      estimatedValue: proposal.estimatedValue,
      metadata: proposal.metadata,
      payload: proposal.payload,
      status: 'pending',
    });

    await action.save();
    logger.info(`Created action: ${action.title}`, { actionId: action._id });
    this.emit('action-created', action);

    return action;
  }

  /**
   * Check if an action should be auto-approved based on restaurant settings
   */
  protected async shouldAutoApprove(action: AgentActionDocument): Promise<boolean> {
    // High impact actions always require approval
    if (action.impact === 'high') {
      return false;
    }

    const restaurant = await Restaurant.findById(this.restaurantId);
    if (!restaurant) {
      return false;
    }

    const settings = restaurant.settings;

    // Check confidence threshold
    const minConfidence = this.config.maxConfidenceForAutoApproval || 95;
    if (action.confidence < minConfidence) {
      return false;
    }

    // Check value threshold for inventory orders
    if (action.type === 'inventory_order') {
      const orderValue = action.estimatedValue || 0;
      const threshold = settings.autoApprovalThreshold || 200;
      if (orderValue > threshold) {
        return false;
      }
    }

    // Low impact actions with high confidence can be auto-approved
    if (action.impact === 'low' && action.confidence >= 95) {
      return true;
    }

    return false;
  }

  /**
   * Auto-approve and execute an action
   */
  protected async autoApprove(action: AgentActionDocument): Promise<void> {
    try {
      action.status = 'auto-approved';
      action.approvedAt = new Date();
      action.approvedBy = null; // System auto-approval
      await action.save();

      const result = await this.execute(action);

      if (result.success) {
        action.status = 'executed';
        action.executedAt = new Date();
        action.executionResult = result.data;
      } else {
        action.status = 'failed';
        action.executionResult = { error: result.error };
      }

      await action.save();
      logger.info(`Auto-approved and executed action: ${action.title}`, {
        actionId: action._id,
        success: result.success,
      });

      this.emit('action-executed', { action, result });
    } catch (error) {
      logger.error(`Auto-approval failed for action: ${action.title}`, error);
      action.status = 'failed';
      action.executionResult = { error: (error as Error).message };
      await action.save();
    }
  }

  /**
   * Manually approve an action
   */
  async approve(actionId: string, userId: string): Promise<ExecutionResult> {
    const action = await AgentAction.findOne({
      _id: actionId,
      restaurant: this.restaurantId,
      status: 'pending',
    });

    if (!action) {
      return { success: false, error: 'Action not found or already processed' };
    }

    action.status = 'approved';
    action.approvedAt = new Date();
    action.approvedBy = userId as any;
    await action.save();

    const result = await this.execute(action);

    if (result.success) {
      action.status = 'executed';
      action.executedAt = new Date();
      action.executionResult = result.data;
    } else {
      action.status = 'failed';
      action.executionResult = { error: result.error };
    }

    await action.save();
    this.emit('action-executed', { action, result });

    return result;
  }

  /**
   * Reject an action
   */
  async reject(actionId: string, userId: string, reason?: string): Promise<boolean> {
    const action = await AgentAction.findOne({
      _id: actionId,
      restaurant: this.restaurantId,
      status: 'pending',
    });

    if (!action) {
      return false;
    }

    action.status = 'rejected';
    action.rejectedAt = new Date();
    action.rejectedBy = userId as any;
    action.rejectionReason = reason;
    await action.save();

    this.emit('action-rejected', action);
    return true;
  }

  /**
   * Use LLM to generate reasoning for a decision
   */
  protected async generateReasoning(context: string, decision: string): Promise<string> {
    try {
      const response = await openRouterClient.chat({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for restaurant operations. Generate clear, concise reasoning for operational decisions. Focus on data-driven justifications and business impact.`,
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nDecision: ${decision}\n\nProvide a brief reasoning (2-3 sentences) explaining why this decision makes sense from a business perspective.`,
          },
        ],
        maxTokens: 150,
      });

      return response.content;
    } catch (error) {
      logger.error('Failed to generate reasoning:', error);
      return decision;
    }
  }
}

export default BaseAgent;
