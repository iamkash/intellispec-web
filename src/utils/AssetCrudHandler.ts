/**
 * Asset CRUD Handler
 * 
 * Handles all CRUD operations for the asset management system including:
 * - Companies, Sites, Asset Groups, and Assets
 * - Modal forms for create/edit operations
 * - API calls for data persistence
 * - Event handling and notifications
 * 
 * Architecture:
 * - Uses centralized HttpClient service for all API calls
 * - Authentication headers injected automatically
 * - Tenant context injected automatically
 * - No manual header management needed
 */

import { message as antdMessage } from 'antd';
import { httpClient } from '../services/HttpClient';

export interface CrudAction {
  action: string;
  node?: any;
  nodeType?: string;
}

export class AssetCrudHandler {
  private static instance: AssetCrudHandler;
  private context: any = null;
  
  /**
   * Show success message with proper configuration
   */
  private showSuccess(content: string): void {
    antdMessage.success({
      content,
      duration: 3,
      style: {
        marginTop: '20vh',
      },
    });
  }
  
  /**
   * Show error message with proper configuration
   */
  private showError(content: string): void {
    antdMessage.error({
      content,
      duration: 4,
      style: {
        marginTop: '20vh',
      },
    });
  }
  
  public static getInstance(): AssetCrudHandler {
    if (!AssetCrudHandler.instance) {
      AssetCrudHandler.instance = new AssetCrudHandler();
    }
    return AssetCrudHandler.instance;
  }

  public setContext(context: any): void {
    this.context = context;
  }

  /**
   * Handle CRUD actions from gadgets
   */
  public async handleAction(action: string, payload: any): Promise<void> {
switch (action) {
      case 'add-company':
await this.showCompanyForm();
        break;
      case 'add_site':
        await this.showSiteForm(null, payload.node); // Pass parent company
        break;
      case 'add_group':
        await this.showAssetGroupForm(null, payload.node); // Pass parent site
        break;
      case 'add_asset':
        await this.showAssetForm(null, payload.node); // Pass parent asset group
        break;
      case 'edit':
        await this.showEditForm(payload.node);
        break;
      case 'delete':
        try {
          await this.deleteDocument(payload.node);
          this.showSuccess(`${payload.node.nodeType} deleted successfully`);
          await this.refreshData();
        } catch (error) {
          console.error('Delete operation failed:', error);
          this.showError(error instanceof Error ? error.message : 'Failed to delete item');
          // Refresh data anyway to ensure UI is in sync with backend
          await this.refreshData();
        }
        break;
      case 'restore':
        await this.restoreDocument(payload.node);
        this.showSuccess(`${payload.node.nodeType} restored successfully`);
        await this.refreshData();
        break;
      case 'view':
// TODO: Implement view functionality
        break;
      default:
break;
    }
  }

  /**
   * Show company creation form
   */
  private async showCompanyForm(company?: any): Promise<void> {
const isEdit = !!company;
console.log('🏢 Company data for edit:', { 
      company, 
      isEdit, 
      companyId: company?.id,
      companyData: company?.data || company 
    });
    
    // Extract the actual company data (might be nested under 'data' property)
    const companyData = company?.data || company;
    const companyId = companyData?.id || company?.id;
// Use metadata-driven form by navigating to company form workspace
    const navigationPayload = {
      key: 'company-form',
      label: isEdit ? 'Edit Company' : 'Add Company',
      workspace: 'asset-manager/company-form',
      params: {
        id: companyId || 'new',
        mode: isEdit ? 'edit' : 'create',
        returnTo: 'asset-manager/asset-management'
        // Note: Don't pass company_id for company forms - that's only for child forms
      }
    };

    // Use context if available, otherwise fallback to custom event
    if (this.context?.onAction) {
this.context.onAction('navigate', navigationPayload);
    } else {
const event = new CustomEvent('app-navigate', {
        detail: navigationPayload
      });
      window.dispatchEvent(event);
    }
}

  /**
   * Show site creation form
   */
  private async showSiteForm(site?: any, parentCompany?: any): Promise<void> {
const isEdit = !!site;
// Extract the actual data (might be nested under 'data' property)
    const siteData = site?.data || site;
    const siteId = siteData?.id || site?.id;
    const parentCompanyData = parentCompany?.data || parentCompany;
    const parentCompanyId = parentCompanyData?.id || parentCompany?.id;
    
    // Use metadata-driven form by navigating to site form workspace
    const navigationPayload = {
      key: 'site-form',
      label: isEdit ? 'Edit Site' : 'Add Site',
      workspace: 'asset-manager/site-form',
      params: {
        id: siteId || 'new',
        mode: isEdit ? 'edit' : 'create',
        returnTo: 'asset-manager/asset-management',
        company_id: parentCompanyId // Pre-populate company field
      }
    };

    // Use context if available, otherwise fallback to custom event
    if (this.context?.onAction) {
this.context.onAction('navigate', navigationPayload);
    } else {
const event = new CustomEvent('app-navigate', {
        detail: navigationPayload
      });
      window.dispatchEvent(event);
    }
}

  /**
   * Show asset group creation form
   */
  private async showAssetGroupForm(assetGroup?: any, parentSite?: any): Promise<void> {
const isEdit = !!assetGroup;
// Extract the actual data (might be nested under 'data' property)
    const assetGroupData = assetGroup?.data || assetGroup;
    const assetGroupId = assetGroupData?.id || assetGroup?.id;
    const parentSiteData = parentSite?.data || parentSite;
    const parentSiteId = parentSiteData?.id || parentSite?.id;
    
    // Use metadata-driven form by navigating to asset group form workspace
    const navigationPayload = {
      key: 'asset-group-form',
      label: isEdit ? 'Edit Asset Group' : 'Add Asset Group',
      workspace: 'asset-manager/asset-group-form',
      params: {
        id: assetGroupId || 'new',
        mode: isEdit ? 'edit' : 'create',
        returnTo: 'asset-manager/asset-management',
        site_id: parentSiteId // Pre-populate site field
      }
    };

    // Use context if available, otherwise fallback to custom event
    if (this.context?.onAction) {
this.context.onAction('navigate', navigationPayload);
    } else {
const event = new CustomEvent('app-navigate', {
        detail: navigationPayload
      });
      window.dispatchEvent(event);
    }
}

  /**
   * Show asset creation form
   */
  private async showAssetForm(asset?: any, parentAssetGroup?: any): Promise<void> {
const isEdit = !!asset;
// Extract the actual data (might be nested under 'data' property)
    const assetData = asset?.data || asset;
    const assetId = assetData?.id || asset?.id;
    const parentAssetGroupData = parentAssetGroup?.data || parentAssetGroup;
    const parentAssetGroupId = parentAssetGroupData?.id || parentAssetGroup?.id;
    
    // Use metadata-driven form by navigating to asset form workspace
    const navigationPayload = {
      key: 'asset-form',
      label: isEdit ? 'Edit Asset' : 'Add Asset',
      workspace: 'asset-manager/asset-form',
      params: {
        id: assetId || 'new',
        mode: isEdit ? 'edit' : 'create',
        returnTo: 'asset-manager/asset-management',
        asset_group_id: parentAssetGroupId // Pre-populate asset group field
      }
    };

    // Use context if available, otherwise fallback to custom event
    if (this.context?.onAction) {
this.context.onAction('navigate', navigationPayload);
    } else {
const event = new CustomEvent('app-navigate', {
        detail: navigationPayload
      });
      window.dispatchEvent(event);
    }
}

  /**
   * Show edit form based on node type
   */
  private async showEditForm(node: any): Promise<void> {
console.log('✏️ Node structure analysis:', {
      node,
      nodeType: node?.nodeType,
      nodeId: node?.id,
      nodeData: node?.data,
      nodeDataId: node?.data?.id,
      fullNode: JSON.stringify(node, null, 2)
    });
    
    switch (node?.nodeType) {
      case 'company':
        await this.showCompanyForm(node);
        break;
      case 'site':
        await this.showSiteForm(node);
        break;
      case 'asset_group':
        await this.showAssetGroupForm(node);
        break;
      case 'asset':
        await this.showAssetForm(node);
        break;
      default:
        this.showError('Unknown node type for editing');
    }
  }

  /**
   * Save company data
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async saveCompany(data: any, id?: string): Promise<void> {
    const url = id ? `/api/documents/${id}` : '/api/documents';
    const payload = { ...data, type: 'company' };
    
    const response = id 
      ? await httpClient.put(url, payload)
      : await httpClient.post(url, payload);
    
    if (!response.ok) {
      throw new Error(`Failed to save company: ${response.statusText}`);
    }
  }

  /**
   * Save site data
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async saveSite(data: any, id?: string): Promise<void> {
    const url = id ? `/api/documents/${id}` : '/api/documents';
    const payload = { ...data, type: 'site' };
    
    const response = id
      ? await httpClient.put(url, payload)
      : await httpClient.post(url, payload);
    
    if (!response.ok) {
      throw new Error(`Failed to save site: ${response.statusText}`);
    }
  }

  /**
   * Save asset group data
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async saveAssetGroup(data: any, id?: string): Promise<void> {
    const url = id ? `/api/documents/${id}` : '/api/documents';
    const payload = { ...data, type: 'asset_group' };
    
    const response = id
      ? await httpClient.put(url, payload)
      : await httpClient.post(url, payload);
    
    if (!response.ok) {
      throw new Error(`Failed to save asset group: ${response.statusText}`);
    }
  }

  /**
   * Save asset data
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async saveAsset(data: any, id?: string): Promise<void> {
    const url = id ? `/api/documents/${id}` : '/api/documents';
    const payload = { ...data, type: 'asset' };
    
    const response = id
      ? await httpClient.put(url, payload)
      : await httpClient.post(url, payload);
    
    if (!response.ok) {
      throw new Error(`Failed to save asset: ${response.statusText}`);
    }
  }

  /**
   * Delete a document
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async deleteDocument(node: any): Promise<void> {
    // Backend requires 'type' query parameter for DELETE
    const type = node.nodeType || node.type || 'document';
    
    console.log('Attempting to delete document:', {
      id: node.id,
      type: type,
      nodeType: node.nodeType,
      node: node
    });
    
    // First, verify the document exists by fetching it
    try {
      const checkResponse = await httpClient.get(`/api/documents/${node.id}?type=${type}`);
      if (!checkResponse.ok) {
        console.warn(`Document ${node.id} not found or access denied (${checkResponse.status})`);
        // Don't throw here, let the delete attempt proceed to get the actual error
      } else {
        const doc = await checkResponse.json();
        console.log('Document exists:', doc);
      }
    } catch (error) {
      console.warn('Document verification failed:', error);
      // Don't throw here, let the delete attempt proceed
    }
    
    const response = await httpClient.delete(`/api/documents/${node.id}?type=${type}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        node: node
      });
      
      // Provide user-friendly error messages
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 404) {
        throw new Error(`Cannot delete ${type}: The item may have already been deleted or you don't have permission to delete it.`);
      } else {
        throw new Error(`Failed to delete ${type}: ${response.statusText} - ${errorText}`);
      }
    }
  }

  /**
   * Restore a deleted document
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async restoreDocument(node: any): Promise<void> {
    const response = await httpClient.put(`/api/documents/${node.id}`, { deleted: false });
    
    if (!response.ok) {
      throw new Error(`Failed to restore ${node.nodeType}: ${response.statusText}`);
    }
  }

  /**
   * Load companies for selection
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async loadCompanies(): Promise<any[]> {
    const response = await httpClient.get('/api/documents?type=company');
    if (!response.ok) {
      throw new Error('Failed to load companies');
    }
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Load sites for selection
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async loadSites(): Promise<any[]> {
    const response = await httpClient.get('/api/documents?type=site');
    if (!response.ok) {
      throw new Error('Failed to load sites');
    }
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Load asset groups for selection
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async loadAssetGroups(): Promise<any[]> {
    const response = await httpClient.get('/api/documents?type=asset_group');
    if (!response.ok) {
      throw new Error('Failed to load asset groups');
    }
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Load assets for selection
   * Uses centralized HttpClient - auth headers injected automatically
   */
  private async loadAssets(): Promise<any[]> {
    const response = await httpClient.get('/api/documents?type=asset');
    if (!response.ok) {
      throw new Error('Failed to load assets');
    }
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Refresh data by emitting refresh event
   */
  private async refreshData(): Promise<void> {
    // Emit refresh event to reload tree data
    window.dispatchEvent(new CustomEvent('asset-data-refresh'));
  }
}

export default AssetCrudHandler;