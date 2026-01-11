/**
 * Composio Integration Service
 * Handles browser automations and integrations
 * https://platform.composio.dev/
 */

import { config } from '../config'

const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1'

class ComposioService {
  constructor() {
    this.apiKey = config.composio.apiKey
    this.workspaceId = 'shryukgrandhi_workspace'
    this.projectId = 'shryukgrandhi_workspace_first_project'
  }

  async getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey
    }
  }

  /**
   * Execute a browser automation action
   */
  async executeAction(actionName, params = {}) {
    if (!this.apiKey) {
      throw new Error('Composio API key not configured')
    }

    const response = await fetch(`${COMPOSIO_BASE_URL}/actions/${actionName}/execute`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({
        workspace_id: this.workspaceId,
        project_id: this.projectId,
        params
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Composio action failed: ${error}`)
    }

    return await response.json()
  }

  /**
   * Open and fill a form (e.g., supplier order form)
   */
  async fillForm(url, formData) {
    return this.executeAction('browser_fill_form', {
      url,
      fields: formData
    })
  }

  /**
   * Navigate to a URL and extract data
   */
  async navigateAndExtract(url, selectors) {
    return this.executeAction('browser_extract', {
      url,
      selectors
    })
  }

  /**
   * Create tasks in Asana
   */
  async createAsanaTask(projectId, taskData) {
    return this.executeAction('asana_create_task', {
      project_id: projectId,
      ...taskData
    })
  }

  /**
   * Send an email via Gmail
   */
  async sendEmail(to, subject, body) {
    return this.executeAction('gmail_send_email', {
      to,
      subject,
      body
    })
  }

  /**
   * Update Google Sheet
   */
  async updateSheet(spreadsheetId, range, values) {
    return this.executeAction('google_sheets_update', {
      spreadsheet_id: spreadsheetId,
      range,
      values
    })
  }

  /**
   * Get available integrations
   */
  async getIntegrations() {
    if (!this.apiKey) {
      throw new Error('Composio API key not configured')
    }

    const response = await fetch(`${COMPOSIO_BASE_URL}/integrations`, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to get integrations')
    }

    return await response.json()
  }

  /**
   * Check connection status
   */
  async checkConnection() {
    if (!this.apiKey) {
      return false
    }

    try {
      const response = await fetch(`${COMPOSIO_BASE_URL}/health`, {
        headers: await this.getHeaders()
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const composioService = new ComposioService()
export default composioService
