import { Card, Col, Form, InputNumber, Row } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import {
    CheckboxWidget,
    ComboBoxWidget,
    DatePickerWidget,
    InputFieldWidget,
    RadioWidget,
    SignatureWidget,
    TagsInputWidget,
    TextAreaWidget,
    UploadWidget
} from '../../../../widgets/input';
import { BaseGadget } from '../../../base';

interface FormSectionProps {
  section: any;
  sectionIndex: number;
  data: any;
  updateSectionData: (sectionIndex: number, update: any) => void;
  getFormFieldValue: (fieldId: string) => any;
  disabledFields?: string[];
}

export const FormSection: React.FC<FormSectionProps> = ({
  section,
  sectionIndex,
  data,
  updateSectionData,
  getFormFieldValue,
  disabledFields = []
}) => {
  const { user } = useAuth();
  const [fieldOptions, setFieldOptions] = useState<Record<string, Array<{label: string, value: any}>>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  // Simple field options loading
  const loadFieldOptions = useCallback(async (fieldId: string, field: any) => {
    if (!field.optionsUrl || loadingOptions[fieldId] || fieldOptions[fieldId]) return;

    setLoadingOptions(prev => ({ ...prev, [fieldId]: true }));

    try {
      let url = field.optionsUrl;
      
      // Add parent field values as query parameters
      if (field.dependsOn) {
        const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
        const urlParams = new URLSearchParams();
        
        dependencies.forEach((depId: string) => {
          const parentValue = getFormFieldValue(depId);
          if (parentValue !== undefined && parentValue !== '') {
            urlParams.append(depId, parentValue);
          }
        });
        
        if (urlParams.toString()) {
          url += (url.includes('?') ? '&' : '?') + urlParams.toString();
        }
      }

      const response = await BaseGadget.makeAuthenticatedFetch(url);
      const data = await response.json();

      let options: Array<{ label: string; value: any }> = [];
      if (Array.isArray(data)) {
        options = data.map((item: any) => ({
          label: field.labelField ? item[field.labelField] : (item.label || item.name || String(item)),
          value: field.valueField ? item[field.valueField] : (item.value || item.id || item)
        }));
      } else if (data.options && Array.isArray(data.options)) {
        options = data.options.map((item: any) => ({
          label: field.labelField ? item[field.labelField] : (item.label || item.name || String(item)),
          value: field.valueField ? item[field.valueField] : (item.value || item.id || item)
        }));
      } else if (data.data && Array.isArray(data.data)) {
        options = data.data.map((item: any) => ({
          label: field.labelField ? item[field.labelField] : (item.label || item.name || String(item)),
          value: field.valueField ? item[field.valueField] : (item.value || item.id || item)
        }));
      }

      setFieldOptions(prev => ({ ...prev, [fieldId]: options }));
    } catch (error) {
      console.error(`Failed to load options for ${fieldId}:`, error);
    } finally {
      setLoadingOptions(prev => ({ ...prev, [fieldId]: false }));
    }
  }, [fieldOptions, getFormFieldValue, loadingOptions]);

  // Load options for all fields when component mounts or when form data changes
  useEffect(() => {
    if (section.form?.groups) {
      section.form.groups.forEach((group: any) => {
        group.fields?.forEach((field: any) => {
          if (field.optionsUrl) {
            if (!field.dependsOn) {
              // Load independent fields immediately
              loadFieldOptions(field.id, field);
            } else {
              // For dependent fields, check if parent values exist
              const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
              const hasParentValues = dependencies.every((depId: string) => {
                const parentValue = getFormFieldValue(depId);
                console.log(`[FormSection] Checking dependency ${depId} for ${field.id}:`, parentValue);
                return parentValue !== undefined && parentValue !== '';
              });
              
              console.log(`[FormSection] Field ${field.id} hasParentValues:`, hasParentValues, 'dependencies:', dependencies);
              
              if (hasParentValues) {
                // Load dependent field options if parent values exist
                console.log(`[FormSection] Loading options for dependent field ${field.id}`);
                loadFieldOptions(field.id, field);
              }
            }
          }
        });
      });
    }
  }, [section.form?.groups, data?.formData, loadFieldOptions, getFormFieldValue]); // Re-run when form data changes
  
  // Separate effect to handle dependent dropdown loading when global form data becomes available
  useEffect(() => {
    // This effect specifically handles the case where inspection data is loaded after component mount
    if (section.form?.groups) {
      section.form.groups.forEach((group: any) => {
        group.fields?.forEach((field: any) => {
          if (field.optionsUrl && field.dependsOn && !fieldOptions[field.id] && !loadingOptions[field.id]) {
            const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
            const hasAllParentValues = dependencies.every((depId: string) => {
              const parentValue = getFormFieldValue(depId);
              return parentValue !== undefined && parentValue !== '';
            });
            
            if (hasAllParentValues) {
              console.log(`[FormSection] Late-loading options for dependent field ${field.id} after data became available`);
              loadFieldOptions(field.id, field);
            }
          }
        });
      });
    }
  }, [getFormFieldValue, fieldOptions, loadingOptions, section.form?.groups, loadFieldOptions]); // Trigger when dependencies change

  console.log(`[FormSection] Rendering for ${section.id}:`, {
    hasFormProperty: !!section.form,
    hasGroups: !!section.form?.groups,
    groupsLength: section.form?.groups?.length || 0,
    groups: section.form?.groups?.map((g: any) => ({
      id: g.id,
      title: g.title,
      fieldsCount: g.fields?.length || 0
    })) || [],
    willReturn: !section.form?.groups || section.form.groups.length === 0
  });

  // Early return after hooks
  if (!section.form?.groups || section.form.groups.length === 0) {
    console.log(`[FormSection] Early return for ${section.id} - no form groups`);
    return null;
  }

  // Handle field changes and dependent field loading
  const handleFieldChange = (fieldId: string, newValue: any, field: any) => {
    // Update the field value
    const currentFormData = data?.formData || {};
    const newFormData = { ...currentFormData, [fieldId]: newValue };
    
    // Add label fields for grid display
    if (field.id === 'company_id') {
      const option = fieldOptions[fieldId]?.find(opt => opt.value === newValue);
      newFormData.companyId = newValue;
      newFormData.companyName = option?.label || newValue;
    } else if (field.id === 'site_id') {
      const option = fieldOptions[fieldId]?.find(opt => opt.value === newValue);
      newFormData.facilityId = newValue;
      newFormData.facilityName = option?.label || newValue;
    } else if (field.id === 'asset_group_id') {
      const option = fieldOptions[fieldId]?.find(opt => opt.value === newValue);
      newFormData.assetGroupName = option?.label || newValue;
    } else if (field.id === 'asset_id') {
      const option = fieldOptions[fieldId]?.find(opt => opt.value === newValue);
      newFormData.assetName = option?.label || newValue;
      
      // Auto-populate equipment type based on selected asset
      if (option?.label) {
        const assetName = option.label.toLowerCase();
        let equipmentType = 'other';
        
        if (assetName.includes('reactor') || assetName.includes('vessel') || assetName.includes('tank')) {
          equipmentType = 'pressure_vessel';
        } else if (assetName.includes('pump')) {
          equipmentType = 'pump';
        } else if (assetName.includes('compressor')) {
          equipmentType = 'compressor';
        } else if (assetName.includes('exchanger') || assetName.includes('boiler')) {
          equipmentType = 'heat_exchanger';
        } else if (assetName.includes('pipe') || assetName.includes('piping')) {
          equipmentType = 'piping';
        }
        
        newFormData.detected_equipment_type = equipmentType;
        console.log('[FormSection] Auto-populated equipment type:', {
          assetName: option.label,
          detectedType: equipmentType
        });
      }
    }
    
    updateSectionData(sectionIndex, { formData: newFormData });
    
    // Handle dependent fields - clear and reload
    section.form.groups?.forEach((group: any) => {
      group.fields?.forEach((depField: any) => {
        if (depField.dependsOn) {
          const dependencies = Array.isArray(depField.dependsOn) ? depField.dependsOn : [depField.dependsOn];
          if (dependencies.includes(fieldId)) {
            // Clear dependent field value
            const clearedFormData = { ...newFormData };
            delete clearedFormData[depField.id];
            updateSectionData(sectionIndex, { formData: clearedFormData });
            
            // Clear and reload options
            setFieldOptions(prev => {
              const next = { ...prev };
              delete next[depField.id];
              return next;
            });
            
            if (newValue) {
              loadFieldOptions(depField.id, depField);
            }
          }
        }
      });
    });
  };

  console.log(`[FormSection] About to render form for ${section.id}:`, {
    groupsToRender: section.form.groups.length,
    groupDetails: section.form.groups.map((g: any, i: number) => ({
      index: i,
      id: g.id,
      title: g.title,
      fieldsCount: g.fields?.length || 0,
      sampleField: g.fields?.[0] ? {
        id: g.fields[0].id,
        label: g.fields[0].label,
        type: g.fields[0].type
      } : null
    }))
  });

  return (
    <Form layout="vertical" className="form-underline">
        <div className="group-grid">
          {section.form.groups.map((group: any, gi: number) => {
            console.log(`[FormSection] 🎯 MAPPING GROUP ${gi}:`, group);
            
            const rawSpan = group.lgSpan ?? 24; 
            const span = Math.min(Math.max(Number(rawSpan), 1), 24);
            
            console.log(`[FormSection] Rendering group ${gi} (${group.id}):`, {
              groupId: group.id,
              groupTitle: group.title,
              fieldsCount: group.fields?.length || 0,
              span,
              fields: group.fields?.map((f: any) => ({ id: f.id, label: f.label, type: f.type })) || []
            });
            
            return (
              <div key={gi} className="group-grid-item" style={{ gridColumn: `span ${span}` }}>
                <Card 
                  size="small" 
                  className="form-group-card glass-subcard" 
                  title={group.title || group.name || group.id}
                >
                  <Row gutter={[12, 12]}>
                    {(group.fields || []).map((field: any) => {
                      if (!field || !field.id) {
                        console.log(`[FormSection] ⚠️ Skipping invalid field:`, field);
                        return null;
                      }
                      
                      // CRITICAL FIX: Use getFormFieldValue to access globalFormData
                      const value = getFormFieldValue(field.id);
                      
                      console.log(`[FormSection] 🎨 Rendering field ${field.id}:`, {
                        fieldId: field.id,
                        fieldLabel: field.label,
                        fieldType: field.type,
                        hasValue: value !== undefined,
                        value: value,
                        hasOptions: !!field.options,
                        optionsCount: field.options?.length || 0
                      });
                      
                      const updateField = (v: any) => {
                        handleFieldChange(field.id, v, field);
                      };
                      
                      const isWide = field.type === 'textarea' || field.type === 'file' || field.type === 'static_checklist' || field.type === 'signature';
                      const lgSpan = field.lgSpan ?? (isWide ? 24 : 12);
                      
                      return (
                        <Col key={field.id} xs={24} md={24} lg={lgSpan} xl={lgSpan}>
                          <Form.Item 
                            label={field.label} 
                            required={field.required} 
                            labelCol={{ span: 24 }} 
                            wrapperCol={{ span: 24 }}
                          >
                            {field.type === 'text' && (
                              <InputFieldWidget 
                                variant="underlined" 
                                value={value} 
                                onChange={updateField} 
                                disabled={disabledFields.includes(field.id)}
                              />
                            )}
                            {field.type === 'number' && (
                              <InputNumber 
                                value={value} 
                                onChange={updateField} 
                                style={{ width: '100%' }} 
                                disabled={disabledFields.includes(field.id)}
                              />
                            )}
                            {field.type === 'date' && (
                              <DatePickerWidget 
                                variant="underlined" 
                                value={value} 
                                onChange={updateField} 
                                disabled={disabledFields.includes(field.id)}
                              />
                            )}
                            {field.type === 'textarea' && (
                              <TextAreaWidget 
                                variant="underlined" 
                                value={value} 
                                onChange={updateField} 
                                disabled={disabledFields.includes(field.id)}
                              />
                            )}
                            {field.type === 'signature' && (
                              <SignatureWidget 
                                id={field.id} 
                                label={field.label} 
                                value={value} 
                                onChange={updateField} 
                                required={field.required} 
                                signedBy={user ? `${user.firstName} ${user.lastName}` : 'Unknown User'} 
                                {...(field.props || {})} 
                              />
                            )}
                            {field.type === 'dropdown' && (
                              <ComboBoxWidget 
                                variant="underlined" 
                                value={value} 
                                onChange={updateField} 
                                options={(field.options || []).map((o: any) => typeof o === 'string' ? { label: o, value: o } : o)} 
                              />
                            )}
                            {field.type === 'select' && (
                              <ComboBoxWidget
                                variant="underlined"
                                value={typeof value === 'object' && value?.value ? value.value : value}
                                onChange={(selectedValue: any) => {
                                  const valueToStore = typeof selectedValue === 'object' && selectedValue?.value 
                                    ? selectedValue.value 
                                    : selectedValue;
                                  updateField(valueToStore);
                                }}
                                options={(() => {
                                  const options = fieldOptions[field.id] || (field.options || []).map((o: any) => typeof o === 'string' ? { label: o, value: o } : o);
                                  
                                  // If we have a value but no matching option, try to get the label from saved data
                                  if (value && !options.find(opt => opt.value === value)) {
                                    let label = value;
                                    
                                    // Try to get label from saved form data
                                    if (field.id === 'site_id' && data?.formData?.facilityName) {
                                      label = data.formData.facilityName;
                                    } else if (field.id === 'asset_group_id' && data?.formData?.assetGroupName) {
                                      label = data.formData.assetGroupName;
                                    } else if (field.id === 'asset_id' && data?.formData?.assetName) {
                                      label = data.formData.assetName;
                                    } else if (field.id === 'company_id' && data?.formData?.companyName) {
                                      label = data.formData.companyName;
                                    }
                                    
                                    // Add the saved option to the list
                                    options.push({ label, value });
                                  }
                                  
                                  return options;
                                })()}
                                placeholder={field.placeholder || (loadingOptions[field.id] ? 'Loading...' : 'Select...')}
                                readOnly={field.readonly}
                                disabled={loadingOptions[field.id]}
                              />
                            )}
                            {field.type === 'radio' && (
                              <RadioWidget 
                                value={value} 
                                onChange={updateField} 
                                options={(field.options || []).map((o: any) => typeof o === 'string' ? { label: o, value: o } : o)} 
                              />
                            )}
                            {field.type === 'checkbox_group' && (
                              <CheckboxWidget 
                                direction="horizontal" 
                                value={value || []} 
                                onChange={updateField} 
                                options={(field.options || []).map((o: any) => typeof o === 'string' ? { label: o, value: o } : o)} 
                              />
                            )}
                            {field.type === 'multi-select' && (
                              <TagsInputWidget value={value || []} onChange={updateField} />
                            )}
                            {field.type === 'file' && (
                              <UploadWidget onChange={({ fileList }) => updateField(fileList)} />
                            )}
                            {field.type === 'static_checklist' && (
                              <div style={{ fontSize: 12, color: 'var(--ant-color-text)' }}>
                                {(field.options || []).join(', ')}
                              </div>
                            )}
                          </Form.Item>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              </div>
            );
          })}
        </div>
      </Form>
  );
};
