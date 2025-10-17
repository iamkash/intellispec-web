/**
 * Data Import/Export Gadget - Refactored with Modern Architecture
 * 
 * Features:
 * - Modular step-based architecture
 * - Fixed header and footer with scrollable body
 * - Professional UI with theme colors
 * - State-of-the-art stepper design
 * - Auto-calculated workspace height
 */

import { CheckOutlined, SwapOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { httpClient } from '../../../../services/HttpClient';
import { AIColumnMapper } from '../../../../utils/AIColumnMapper';
import {
    ColumnMappingStep,
    DocumentTypeSelection,
    FileUploadStep,
    ImportResultsStep,
    ParentEntitySelection,
    ValidationStep
} from './steps';
import './styles/DataImportExport.css';
import {
    AIMapping,
    ColumnMapping,
    DataImportExportConfig,
    DocumentTypeOption,
    FieldDefinition,
    ImportSummary,
    ParentEntityConfig,
    ValidationError
} from './types';
import {
    discoverAllHierarchyFields,
    discoverFormFields,
    transformImportedData
} from './utils/fieldUtils';

interface DataImportExportProps {
  config: DataImportExportConfig;
  workspaceHeight?: number;
}

export const DataImportExportGadget: React.FC<DataImportExportProps> = ({
  config,
  workspaceHeight
}) => {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDocTypeOption, setSelectedDocTypeOption] = useState<DocumentTypeOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [columns, setColumns] = useState<ColumnMapping[]>([]);
  const [aiMappings, setAiMappings] = useState<AIMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [, setProgress] = useState(0);
  const [allFieldDefinitions, setAllFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [selectedParents, setSelectedParents] = useState<Record<string, any>>({});
  const [availableParents, setAvailableParents] = useState<Record<string, any[]>>({});
  const [loadingParents, setLoadingParents] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate container height
  useEffect(() => {
    const calculateHeight = () => {
      if (workspaceHeight) {
        setContainerHeight(workspaceHeight);
      } else if (containerRef.current) {
        const parentHeight = containerRef.current.parentElement?.clientHeight || 600;
        setContainerHeight(parentHeight);
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [workspaceHeight]);

  const documentType = selectedDocTypeOption?.value || config.documentType || 'asset';

  // Steps configuration
  const steps = [
    {
      title: 'Select Type',
      description: 'Choose data type'
    },
    ...((selectedDocTypeOption?.parentEntities?.length || 0) > 0 ? [{
      title: 'Parent Entities',
      description: 'Select parents'
    }] : []),
    {
      title: 'Upload File',
      description: 'Upload Excel'
    },
    {
      title: 'Map Columns',
      description: 'AI mapping'
    },
    {
      title: 'Validate',
      description: 'Review data'
    },
    {
      title: 'Import',
      description: 'Complete import'
    }
  ];

  // Handlers
  const handleDocTypeSelect = (option: DocumentTypeOption) => {
    setSelectedDocTypeOption(option);
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleReset = useCallback(() => {
    setCurrentStep(config.documentTypeSelection?.enabled ? 0 : 1);
    setSelectedDocTypeOption(null);
    setSelectedParents({});
    setAvailableParents({});
    setExcelFile(null);
    setExcelData([]);
    setColumns([]);
    setAiMappings([]);
    setAllFieldDefinitions([]);
    setValidationErrors([]);
    setImportSummary(null);
    setProgress(0);
    setIsProcessing(false);
  }, [config.documentTypeSelection?.enabled]);
  
  const loadParentEntities = useCallback(async (parentConfig: ParentEntityConfig) => {
    setLoadingParents(true);
    try {
      const response = await httpClient.get(parentConfig.apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        setAvailableParents(prev => ({
          ...prev,
          [parentConfig.type]: data.data || []
        }));
      }
    } catch (error) {
      console.error(`Failed to load ${parentConfig.label}:`, error);
      // Using message would require importing it. For now, console.error is fine.
    } finally {
      setLoadingParents(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setExcelFile(file);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          
          if (jsonData.length === 0) {
            console.error('Excel file is empty');
            setIsProcessing(false);
            return;
          }

          let headerRowIndex = 0;
          let headerRowWithIndices: Array<{ value: string; originalIndex: number }> = [];
          
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i] as any[];
            const cellsWithIndices = row
              .map((cell, idx) => ({ value: cell, originalIndex: idx }))
              .filter(({ value }) => value !== undefined && value !== null && value !== '');
            
            if (cellsWithIndices.length > 0) {
              headerRowWithIndices = cellsWithIndices;
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowWithIndices.length === 0) {
            console.error('No header row found in Excel file.');
            setIsProcessing(false);
            return;
          }
          
          const headerRow = headerRowWithIndices.map(c => c.value);
          const dataRows = jsonData.slice(headerRowIndex + 1);

           const detectedColumns: ColumnMapping[] = headerRowWithIndices.map(({ value: col, originalIndex }) => {
             const sampleValues = dataRows
               .slice(0, 5)
               .map((row: any) => row[originalIndex])
               .filter((val: any) => val !== undefined && val !== null && val !== '');

            const dbField = null;

            let dataType: 'string' | 'number' | 'date' | 'boolean' = 'string';
            if (sampleValues.length > 0) {
              const firstValue = sampleValues[0];
              if (typeof firstValue === 'number') {
                dataType = 'number';
              } else if (typeof firstValue === 'boolean') {
                dataType = 'boolean';
              } else if (!isNaN(Date.parse(String(firstValue)))) {
                dataType = 'date';
              }
            }

            return {
              excelColumn: col,
              excelColumnIndex: originalIndex,
              dbField,
              sampleValues,
              dataType,
              required: false,
              mapped: dbField !== null,
            };
          });

           setColumns(detectedColumns);
           setExcelData(dataRows);
           
          let discoveredFields: FieldDefinition[] = [];
          
          if (selectedDocTypeOption) {
            if (selectedDocTypeOption.loadHierarchyFields && selectedDocTypeOption.hierarchyLevels) {
                const docTypeOptions = config.documentTypeSelection?.options || [];
                const formPaths = selectedDocTypeOption.hierarchyLevels
                    .map((level: string) => {
                        const option = docTypeOptions.find(opt => opt.value === level);
                        if (option) {
                            return { formPath: option.formPath, type: level, prefix: option.label };
                        }
                        return null;
                    })
                    .filter((p: { formPath: string; type: string; prefix: string } | null): p is { formPath: string; type: string; prefix: string } => p !== null);
                
                // Add the current asset form path as well
                formPaths.push({ formPath: selectedDocTypeOption.formPath, type: selectedDocTypeOption.value, prefix: selectedDocTypeOption.label });

                discoveredFields = await discoverAllHierarchyFields(formPaths);
            } else {
                discoveredFields = await discoverFormFields(selectedDocTypeOption.formPath, selectedDocTypeOption.value);
            }
          } else {
            const allOptions = config.documentTypeSelection?.options || [];
            const option = allOptions.find(opt => opt.value === documentType);
            if (option) {
              discoveredFields = await discoverFormFields(option.formPath, documentType);
            }
          }
          
          setAllFieldDefinitions(discoveredFields);
           
           if (config.aiConfig) {
             try {
               const aiMapper = new AIColumnMapper({
                 fieldDefinitions: discoveredFields,
                 aiConfig: config.aiConfig
               });
               
               const sampleData = detectedColumns.map(col => ({
                 excelColumn: col.excelColumn,
                 values: col.sampleValues
               }));
               
               const aiMappingResults = await aiMapper.autoMap(headerRow, sampleData);
               
               setAiMappings(aiMappingResults);
               
               const aiMappedColumns = detectedColumns.map(col => {
                 const aiMapping = aiMappingResults.find(m => m.excelColumn === col.excelColumn);
                 if (aiMapping && aiMapping.confidence >= 0.7) {
                   return {
                     ...col,
                     dbField: aiMapping.dbField,
                     mapped: !!aiMapping.dbField
                   };
                 }
                 return col;
               });
              
              setColumns(aiMappedColumns);
             } catch (aiError) {
               console.warn('AI mapping failed, falling back to basic mapping:', aiError);
             }
           }
           
           handleNext();

        } catch (error) {
          console.error('Error parsing Excel:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        setIsProcessing(false);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsProcessing(false);
    }
  }, [config.aiConfig, documentType, selectedDocTypeOption, config.documentTypeSelection?.options]);

  const handleColumnMappingChange = useCallback((excelColumn: string, dbField: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.excelColumn === excelColumn
          ? { ...col, dbField: dbField || null, mapped: !!dbField }
          : col
      )
    );
  }, []);

  const validateData = useCallback(() => {
    const errors: ValidationError[] = [];
    const mappedColumns = columns.filter((c) => c.mapped);

    const fieldDefMap = new Map(allFieldDefinitions.map(f => [f.dbField, f]));

    const rowsToValidate = excelData.slice(0, 100);
    
    rowsToValidate.forEach((row, rowIndex) => {
      const document: any = {};
      mappedColumns.forEach((col) => {
        const value = row[col.excelColumnIndex];
        if (value !== undefined && value !== null && value !== '') {
          document[col.dbField!] = value;
        }
      });
      
     mappedColumns.forEach((col) => {
       const value = row[col.excelColumnIndex];
       const fieldDef = fieldDefMap.get(col.dbField!);

        if (fieldDef?.required && (value === undefined || value === null || value === '')) {
          if (col.dbField === 'asset_group_id' && document.asset_group_code) {
          }
          else if (col.dbField === 'site_id' && document.site_code) {
          }
          else {
            errors.push({
              row: rowIndex + 2,
              column: col.excelColumn,
              error: `Required field is empty`,
              value,
            });
          }
        }

        if (value !== undefined && value !== null && value !== '') {
          if (fieldDef?.dataType === 'number' && isNaN(Number(value))) {
            errors.push({
              row: rowIndex + 2,
              column: col.excelColumn,
              error: `Expected number but got "${value}"`,
              value,
            });
          }
        }
      });
    });

   setValidationErrors(errors);
   return errors.length === 0;
  }, [columns, excelData, allFieldDefinitions]);

  useEffect(() => {
    const hasParents = (selectedDocTypeOption?.parentEntities?.length || 0) > 0;
    const validationIndex = hasParents ? 4 : 3;
    if (currentStep === validationIndex) {
      setTimeout(() => {
        validateData();
      }, 100);
    }
  }, [currentStep, validateData, selectedDocTypeOption]);
  
  const performImport = useCallback(async () => {
    if (!validateData()) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const mappedColumns = columns.filter((c) => c.mapped);
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;
      const errors: ValidationError[] = [];
      const createdIds: string[] = [];
      
      const entityCache = {
        companies: new Map<string, any>(),
        sites: new Map<string, any>(),
        assetGroups: new Map<string, any>(),
        nameToId: {
            company: new Map<string, string>(),
            site: new Map<string, string>(),
            asset_group: new Map<string, string>(),
        },
        codeToId: {
            company: new Map<string, string>(),
            site: new Map<string, string>(),
            asset_group: new Map<string, string>(),
        }
      };

      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        
        const companyData: any = {};
        const siteData: any = {};
        const assetGroupData: any = {};
        const assetData: any = { type: documentType };
        let finalAsset: any = {};
        
        mappedColumns.forEach((col) => {
          const value = row[col.excelColumnIndex];
          if (value !== undefined && value !== null && value !== '') {
            const dbField = col.dbField!;
            
            if (dbField.startsWith('company_')) {
              const fieldName = dbField.replace(/^company_/, '');
              if (fieldName !== 'type') {
                companyData[fieldName] = value;
              }
            } else if (dbField.startsWith('site_')) {
              const fieldName = dbField.replace(/^site_/, '');
              if (fieldName !== 'type') {
                siteData[fieldName] = value;
              }
            } else if (dbField.startsWith('asset_group_')) {
              const fieldName = dbField.replace(/^asset_group_/, '');
              if (fieldName !== 'type') {
                assetGroupData[fieldName] = value;
              }
            } else if (dbField.startsWith('asset_') && !['asset_tag', 'asset_type', 'asset_group_id'].includes(dbField)) {
              const fieldName = dbField.replace(/^asset_/, '');
              if (fieldName !== 'type') {
                assetData[fieldName] = value;
              } else {
                assetData['asset_type'] = value;
              }
            } else {
              if (dbField !== 'type') {
                assetData[dbField] = value;
              }
            }
          }
        });
        

        try {
           const parentEntities = selectedDocTypeOption?.parentEntities || [];
           parentEntities.forEach(parentConfig => {
             const selectedParent = selectedParents[parentConfig.type];
             if (selectedParent) {
               assetData[parentConfig.linkedField] = selectedParent[parentConfig.valueField];
             }
           });
           
           let companyId: string | undefined = assetData.company_id;
           let siteId: string | undefined = assetData.site_id;
           let assetGroupId: string | undefined = assetData.asset_group_id;
           
          // --- Enhanced Company Lookup ---
          if (!companyId) {
            const lookupName = companyData.name;
            const lookupCode = companyData.code || companyData.id;

            if (lookupName && entityCache.nameToId.company.has(lookupName)) {
                companyId = entityCache.nameToId.company.get(lookupName);
            } else if (lookupCode && entityCache.codeToId.company.has(lookupCode)) {
                companyId = entityCache.codeToId.company.get(lookupCode);
            } else if (companyData.id && entityCache.companies.has(companyData.id)) {
                companyId = companyData.id;
            } else {
                // Database lookup as fallback
                const query = lookupCode ? `code=${encodeURIComponent(lookupCode)}` : `name=${encodeURIComponent(lookupName)}`;
                if (query) {
                    try {
                        const response = await httpClient.get(`/api/documents?type=company&${query}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && data.data.length > 0) {
                                const found = data.data[0];
                                companyId = found.id;
                                entityCache.companies.set(found.id, found);
                                if (found.name) entityCache.nameToId.company.set(found.name, found.id);
                                if (found.code) entityCache.codeToId.company.set(found.code, found.id);
                            }
                        }
                    } catch (err) {
                        console.warn('Company lookup failed, proceeding to create:', err);
                    }
                }
            }
          }

          if ((companyData.name || companyData.code) && !companyId) {
             const lookupCode = companyData.code || companyData.name;
             try {
                let newCompany = {
                  type: 'company',
                  ...companyData,
                  name: companyData.name || lookupCode,
                  code: companyData.code || lookupCode.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
                  status: companyData.status || 'active'
                };
                newCompany = transformImportedData(newCompany, allFieldDefinitions);
                
                const createResponse = await httpClient.post('/api/documents', newCompany);
                if (createResponse.ok) {
                  const created = await createResponse.json();
                  const newEntity = created.data || created;
                  companyId = newEntity.id;
                  entityCache.companies.set(newEntity.id, newEntity);
                  if (newEntity.name) entityCache.nameToId.company.set(newEntity.name, newEntity.id);
                  if (newEntity.code) entityCache.codeToId.company.set(newEntity.code, newEntity.id);
                }
             } catch (err) {
               console.warn('Company creation failed:', err);
             }
           }
           
           // --- Enhanced Site Lookup ---
          if (!siteId) {
            const lookupName = siteData.name;
            const lookupCode = siteData.code || siteData.id;

            if (lookupName && entityCache.nameToId.site.has(lookupName)) {
                siteId = entityCache.nameToId.site.get(lookupName);
            } else if (lookupCode && entityCache.codeToId.site.has(lookupCode)) {
                siteId = entityCache.codeToId.site.get(lookupCode);
            } else if (siteData.id && entityCache.sites.has(siteData.id)) {
                siteId = siteData.id;
            } else {
                // Database lookup as fallback
                const query = lookupCode ? `code=${encodeURIComponent(lookupCode)}` : `name=${encodeURIComponent(lookupName)}`;
                 if (query) {
                    try {
                        const response = await httpClient.get(`/api/documents?type=site&${query}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && data.data.length > 0) {
                                const found = data.data[0];
                                siteId = found.id;
                                entityCache.sites.set(found.id, found);
                                if (found.name) entityCache.nameToId.site.set(found.name, found.id);
                                if (found.code) entityCache.codeToId.site.set(found.code, found.id);
                            }
                        }
                    } catch (err) {
                        console.warn('Site lookup failed, proceeding to create:', err);
                    }
                }
            }
          }

          if ((siteData.name || siteData.code) && !siteId) {
             const lookupCode = siteData.code || siteData.name;
             try {
                let newSite = {
                  type: 'site',
                  ...siteData,
                  name: siteData.name || lookupCode,
                  code: siteData.code || lookupCode.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
                  company_id: companyId,
                  status: siteData.status || 'active'
                };
                newSite = transformImportedData(newSite, allFieldDefinitions);
                
                const createResponse = await httpClient.post('/api/documents', newSite);
                if (createResponse.ok) {
                  const created = await createResponse.json();
                  const newEntity = created.data || created;
                  siteId = newEntity.id;
                  entityCache.sites.set(newEntity.id, newEntity);
                  if (newEntity.name) entityCache.nameToId.site.set(newEntity.name, newEntity.id);
                  if (newEntity.code) entityCache.codeToId.site.set(newEntity.code, newEntity.id);
                }
             } catch (err) {
               console.warn('Site creation failed:', err);
             }
           }
           
          // --- Enhanced Asset Group Lookup ---
          if (!assetGroupId) {
            const lookupName = assetGroupData.name;
            const lookupCode = assetGroupData.code || assetGroupData.id;

            if (lookupName && entityCache.nameToId.asset_group.has(lookupName)) {
                assetGroupId = entityCache.nameToId.asset_group.get(lookupName);
            } else if (lookupCode && entityCache.codeToId.asset_group.has(lookupCode)) {
                assetGroupId = entityCache.codeToId.asset_group.get(lookupCode);
            } else if (assetGroupData.id && entityCache.assetGroups.has(assetGroupData.id)) {
                assetGroupId = assetGroupData.id;
            } else {
                const query = lookupCode ? `code=${encodeURIComponent(lookupCode)}` : `name=${encodeURIComponent(lookupName)}`;
                 if (query) {
                    try {
                        const response = await httpClient.get(`/api/documents?type=asset_group&${query}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && data.data.length > 0) {
                                const found = data.data[0];
                                assetGroupId = found.id;
                                entityCache.assetGroups.set(found.id, found);
                                if (found.name) entityCache.nameToId.asset_group.set(found.name, found.id);
                                if (found.code) entityCache.codeToId.asset_group.set(found.code, found.id);
                            }
                        }
                    } catch (err) {
                        console.warn('Asset Group lookup failed, proceeding to create:', err);
                    }
                }
            }
          }

          if ((assetGroupData.name || assetGroupData.code) && !assetGroupId) {
             const lookupCode = assetGroupData.code || assetGroupData.name;
             try {
                let newGroup = {
                  type: 'asset_group',
                  ...assetGroupData,
                  name: assetGroupData.name || lookupCode,
                  code: assetGroupData.code || lookupCode.toUpperCase().replace(/\s+/g, '-').substring(0, 20),
                  site_id: siteId,
                  status: assetGroupData.status || 'active'
                };
                newGroup = transformImportedData(newGroup, allFieldDefinitions);
                
                const createResponse = await httpClient.post('/api/documents', newGroup);
                if (createResponse.ok) {
                  const created = await createResponse.json();
                  const newEntity = created.data || created;
                  assetGroupId = newEntity.id;
                  entityCache.assetGroups.set(newEntity.id, newEntity);
                  if (newEntity.name) entityCache.nameToId.asset_group.set(newEntity.name, newEntity.id);
                  if (newEntity.code) entityCache.codeToId.asset_group.set(newEntity.code, newEntity.id);
                }
             } catch (err) {
               console.warn('Asset Group creation failed:', err);
             }
           }
           
           finalAsset = {
             ...assetData,
             company_id: companyId,
             site_id: siteId,
             asset_group_id: assetGroupId
           };
           
           finalAsset = transformImportedData(finalAsset, allFieldDefinitions);
           
           if (!finalAsset.asset_tag && siteId && assetGroupId && finalAsset.asset_type) {
             try {
               let companyCode = '';
               let facilityCode = '';
               let unitCode = '';
               
              if (companyId) {
                try {
                  if (!entityCache.companies.has(companyId)) {
                    const companyResponse = await httpClient.get(`/api/documents/${companyId}?type=company`);
                    if (companyResponse.ok) {
                      const companyData = await companyResponse.json();
                      entityCache.companies.set(companyId, companyData.data || companyData);
                    }
                  }
                  
                  const companyData = entityCache.companies.get(companyId);
                  if (companyData) {
                    companyCode = (companyData.code || companyData.name)
                      .toUpperCase()
                      .replace(/\s+/g, '_')
                      .substring(0, 10);
                  }
                } catch (err) {
                  console.warn('Company lookup for asset tag failed:', err);
                }
              }
              
              if (siteId) {
                try {
                  if (!entityCache.sites.has(siteId)) {
                    const siteResponse = await httpClient.get(`/api/documents/${siteId}?type=site`);
                    if (siteResponse.ok) {
                      const siteData = await siteResponse.json();
                      entityCache.sites.set(siteId, siteData.data || siteData);
                    }
                  }
                  
                  const siteData = entityCache.sites.get(siteId);
                  if (siteData) {
                    facilityCode = (siteData.code || siteData.name)
                      .toUpperCase()
                      .replace(/\s+/g, '_')
                      .substring(0, 10);
                  }
                } catch (err) {
                  console.warn('Site lookup for asset tag failed:', err);
                }
              }
              
              if (assetGroupId) {
                try {
                  if (!entityCache.assetGroups.has(assetGroupId)) {
                    const groupResponse = await httpClient.get(`/api/documents/${assetGroupId}?type=asset_group`);
                    if (groupResponse.ok) {
                      const groupData = await groupResponse.json();
                      entityCache.assetGroups.set(assetGroupId, groupData.data || groupData);
                    }
                  }
                  
                  const groupData = entityCache.assetGroups.get(assetGroupId);
                  if (groupData) {
                    unitCode = (groupData.code || groupData.name)
                      .toUpperCase()
                      .replace(/\s+/g, '-')
                      .substring(0, 10);
                  }
                } catch (err) {
                  console.warn('Asset Group lookup for asset tag failed:', err);
                }
              }
               
               const typeMap: Record<string, string> = {
                 'Pipe': 'P', 'Valve': 'V', 'Tank': 'T', 'Pump': 'PUMP', 'Compressor': 'COMP',
                 'Heat Exchanger': 'HX', 'Vessel': 'VSL', 'Reactor': 'R', 'Instrument': 'INST',
                 'Motor': 'MOT', 'Electrical': 'ELEC'
               };
               const typeCode = typeMap[finalAsset.asset_type] || finalAsset.asset_type.substring(0, 1).toUpperCase();
               
               const tagPrefix = companyCode 
                 ? `${companyCode}-${facilityCode}-${unitCode}-${typeCode}`
                 : `${facilityCode}-${unitCode}-${typeCode}`;
               
               const response = await httpClient.get(
                 `/api/documents?type=asset&asset_tag_like=${encodeURIComponent(tagPrefix)}&sort=asset_tag:desc&limit=1`
               );
               
               let sequenceNumber = 1;
               if (response.ok) {
                 const data = await response.json();
                 if (data.data && data.data.length > 0) {
                   const lastTag = data.data[0].asset_tag;
                   const lastNumberMatch = lastTag.match(/-(\d+)$/);
                   if (lastNumberMatch) {
                     sequenceNumber = parseInt(lastNumberMatch[1], 10) + 1;
                   }
                 }
               }
               
              finalAsset.asset_tag = `${tagPrefix}-${sequenceNumber.toString().padStart(4, '0')}`;
               
             } catch (err) {
               console.warn('Asset tag auto-generation failed:', err);
             }
           }
           
          const updateKey = selectedDocTypeOption?.updateKey;
          let existingRecord = null;
          
          if (updateKey) {
            const updateValue = finalAsset[updateKey];
            if (updateValue) {
                const response = await httpClient.get(
                  `/api/documents?type=${documentType}&${updateKey}=${encodeURIComponent(updateValue)}`
                );
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.data && data.data.length > 0) {
                    existingRecord = data.data[0];
                  }
                }
            }
          }

         if (existingRecord) {
           if (config.importConfig?.skipDuplicates) {
             skipped++;
           } else {
             const response = await httpClient.put(
               `/api/documents/${existingRecord.id}`,
               finalAsset
             );
             
             if (response.ok) {
               updated++;
             } else {
               failed++;
               errors.push({
                 row: i + 2,
                 column: 'ALL',
                 error: `Failed to update: ${response.statusText}`,
                 value: finalAsset,
               });
             }
           }
         } else {
           const response = await httpClient.post('/api/documents', finalAsset);
           
           if (response.ok) {
             created++;
             const createdDoc = await response.json();
             createdIds.push(createdDoc.id || createdDoc.data?.id);
           } else {
             failed++;
             const errorData = await response.json();
             errors.push({
               row: i + 2,
               column: 'ALL',
               error: errorData.error || `Failed to create: ${response.statusText}`,
               value: finalAsset,
             });
           }
         }
       } catch (error) {
         failed++;
         errors.push({
           row: i + 2,
           column: 'ALL',
           error: error instanceof Error ? error.message : 'Unknown error',
           value: finalAsset,
         });
       }

        setProgress(Math.round(((i + 1) / excelData.length) * 100));
      }

      setImportSummary({
        total: excelData.length,
        created,
        updated,
        skipped,
        failed,
        errors,
        createdIds,
        duration: 0 // Will be calculated in the step
      });

      handleNext();

    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [validateData, columns, excelData, documentType, config, selectedDocTypeOption, selectedParents, allFieldDefinitions]);

  // Render step content
  const renderStepContent = () => {
    if (!config.documentTypeSelection?.enabled) {
      return <div>Document type selection is not enabled</div>;
    }

    const hasParents = (selectedDocTypeOption?.parentEntities?.length || 0) > 0;

    if (currentStep === 0) {
      return (
        <DocumentTypeSelection
          options={config.documentTypeSelection.options}
          selectedOption={selectedDocTypeOption}
          onSelect={handleDocTypeSelect}
          title={config.documentTypeSelection.title}
          description={config.documentTypeSelection.description}
        />
      );
    }

    if (hasParents) {
      switch (currentStep) {
        case 1:
          return (
            <ParentEntitySelection
              parentEntities={selectedDocTypeOption?.parentEntities || []}
              availableParents={availableParents}
              selectedParents={selectedParents}
              setSelectedParents={setSelectedParents}
              loadParentEntities={loadParentEntities}
              loadingParents={loadingParents}
            />
          );
        case 2:
          return (
            <FileUploadStep
              documentType={selectedDocTypeOption?.label || config.documentType}
              isProcessing={isProcessing}
              onFileSelect={handleFileUpload}
            />
          );
        case 3:
          return (
            <ColumnMappingStep
              columns={columns}
              aiMappings={aiMappings}
              fieldDefinitions={allFieldDefinitions}
              onColumnMappingChange={handleColumnMappingChange}
            />
          );
        case 4:
          return (
            <ValidationStep
              validationErrors={validationErrors}
              previewData={excelData.slice(0, 10).map(row => {
                  const rowData: { [key: string]: any } = {};
                  columns.filter(c => c.mapped).forEach(col => {
                      rowData[col.excelColumn] = row[col.excelColumnIndex];
                  });
                  return rowData;
              })}
              mappedColumns={columns.filter(c => c.mapped).map(c => ({ title: c.excelColumn, dataIndex: c.excelColumn, key: c.excelColumn}))}
            />
          );
        case 5:
          return (
            <ImportResultsStep
              summary={importSummary}
              documentType={selectedDocTypeOption?.label || config.documentType}
              onReset={handleReset}
            />
          );
        default:
          return <div>Invalid step</div>;
      }
    } else {
      switch (currentStep) {
        case 1:
          return (
            <FileUploadStep
              documentType={selectedDocTypeOption?.label || config.documentType}
              isProcessing={isProcessing}
              onFileSelect={handleFileUpload}
            />
          );
        case 2:
          return (
            <ColumnMappingStep
              columns={columns}
              aiMappings={aiMappings}
              fieldDefinitions={allFieldDefinitions}
              onColumnMappingChange={handleColumnMappingChange}
            />
          );
        case 3:
          return (
            <ValidationStep
              validationErrors={validationErrors}
              previewData={excelData.slice(0, 10).map(row => {
                  const rowData: { [key: string]: any } = {};
                  columns.filter(c => c.mapped).forEach(col => {
                      rowData[col.excelColumn] = row[col.excelColumnIndex];
                  });
                  return rowData;
              })}
              mappedColumns={columns.filter(c => c.mapped).map(c => ({ title: c.excelColumn, dataIndex: c.excelColumn, key: c.excelColumn}))}
            />
          );
        case 4:
          return (
            <ImportResultsStep
              summary={importSummary}
              documentType={selectedDocTypeOption?.label || config.documentType}
              onReset={handleReset}
            />
          );
        default:
          return <div>Invalid step</div>;
      }
    }
  };

  const canProceed = () => {
    const hasParents = (selectedDocTypeOption?.parentEntities?.length || 0) > 0;
    const columnMappingIndex = hasParents ? 3 : 2;
    const validationIndex = hasParents ? 4 : 3;

    if (currentStep === 0) {
      return selectedDocTypeOption !== null;
    }
    if (currentStep === 1 && hasParents) {
        return (selectedDocTypeOption?.parentEntities || []).every(
            p => !p.required || selectedParents[p.type]
        );
    }
    if (currentStep === columnMappingIndex) {
      return columns.some(col => col.mapped);
    }
    if (currentStep === validationIndex) {
      return validationErrors.length === 0;
    }
    return true;
  };

  const getNextButtonLabel = () => {
    const hasParents = (selectedDocTypeOption?.parentEntities?.length || 0) > 0;
    const validationIndex = hasParents ? 4 : 3;

    if (currentStep === validationIndex - 1) {
      return 'Preview & Validate';
    }
    if (currentStep === validationIndex) {
      return `Import ${excelData.length} Records`;
    }
    return 'Next';
  };

  const handleNextClick = () => {
    const hasParents = (selectedDocTypeOption?.parentEntities?.length || 0) > 0;
    const validationIndex = hasParents ? 4 : 3;

    if (currentStep === validationIndex) {
      performImport();
    } else {
      handleNext();
    }
  };

  return (
    <div
      ref={containerRef}
      className="data-import-export-container"
      style={{ height: `${containerHeight}px` }}
    >
      {/* Fixed Header with Steps */}
      <div className="import-export-header">
        <div className="import-export-header-title">
          <SwapOutlined className="import-export-header-icon" />
          <h2>Data Import & Export</h2>
        </div>
        
        {/* Custom Stepper - No Lines */}
        <div className="custom-stepper">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isWaiting = index > currentStep;
            
            return (
              <div 
                key={index} 
                className={`custom-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isWaiting ? 'waiting' : ''}`}
              >
                <div className="custom-step-icon">
                  {isCompleted ? <CheckOutlined /> : index + 1}
                </div>
                <div className="custom-step-title">{step.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="import-export-body">
        {renderStepContent()}
      </div>

      {/* Fixed Footer */}
      <div className="import-export-footer">
        <div className="footer-info">
          {selectedDocTypeOption && (
            <span>Importing: <strong>{selectedDocTypeOption.label}</strong></span>
          )}
        </div>
        
        <div className="footer-actions">
          {currentStep > 0 && currentStep < steps.length -1 && (
            <Button
              className="btn-secondary"
              onClick={handleBack}
              disabled={isProcessing}
            >
              Back
            </Button>
          )}
          
          {currentStep < steps.length - 1 && (
            <Button
              type="primary"
              className="btn-primary"
              onClick={handleNextClick}
              disabled={!canProceed() || isProcessing}
              loading={isProcessing}
            >
              {getNextButtonLabel()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImportExportGadget;
