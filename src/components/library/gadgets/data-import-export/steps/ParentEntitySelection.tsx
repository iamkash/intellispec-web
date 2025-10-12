import { Card, Select, Typography } from 'antd';
import React from 'react';
import { ParentEntityConfig } from '../types';

const { Title, Paragraph, Text } = Typography;

interface ParentEntitySelectionProps {
    parentEntities: ParentEntityConfig[];
    availableParents: Record<string, any[]>;
    selectedParents: Record<string, any>;
    setSelectedParents: (parents: Record<string, any>) => void;
    loadParentEntities: (config: ParentEntityConfig) => void;
    loadingParents: boolean;
}

export const ParentEntitySelection: React.FC<ParentEntitySelectionProps> = ({
    parentEntities,
    availableParents,
    selectedParents,
    setSelectedParents,
    loadParentEntities,
    loadingParents
}) => {
    React.useEffect(() => {
        parentEntities.forEach(p => {
            if (!p.filterByParent) { // Load top-level parents immediately
                loadParentEntities(p);
            }
        });
    }, [parentEntities, loadParentEntities]);
    
    // Check if all required parents are selected
    const allRequiredSelected = parentEntities.every(
        parent => !parent.required || selectedParents[parent.type]
    );

    const parentLabels = parentEntities.map(p => p.label.toLowerCase()).join(' and ');

    return (
        <Card>
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={3}>Select Parent Entities</Title>
                <Paragraph type="secondary">
                Choose the {parentLabels} for your imports
                </Paragraph>
            </div>

            {parentEntities.map((parentConfig, index) => {
                const available = availableParents[parentConfig.type] || [];
                const selected = selectedParents[parentConfig.type];
                
                const filteredOptions = parentConfig.filterByParent
                ? available.filter(item => {
                    const parentEntity = selectedParents[parentConfig.filterByParent!];
                    // The field to check in the child is typically parent_type_id
                    const linkField = item[`${parentConfig.filterByParent}_id`] || item['companyId']; // common fallback
                    return parentEntity && linkField === parentEntity[parentConfig.valueField];
                    })
                : available;

                return (
                <div key={parentConfig.type} style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    {parentConfig.label} {parentConfig.required && <span style={{ color: '#ff4d4f' }}>*</span>}
                    </label>
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder={`Select ${parentConfig.label.toLowerCase()}`}
                        loading={loadingParents}
                        value={selected?.[parentConfig.valueField]}
                        onChange={(value) => {
                            const selectedEntity = available.find(e => e[parentConfig.valueField] === value);
                            
                            const newSelectedParents = { ...selectedParents, [parentConfig.type]: selectedEntity };

                            // Reset dependent selections
                            const dependentParents = parentEntities.slice(index + 1);
                            if (dependentParents.length > 0) {
                                dependentParents.forEach(dep => {
                                    delete newSelectedParents[dep.type];
                                });
                            }
                            setSelectedParents(newSelectedParents);

                            // Load data for next dropdown if it depends on this one
                            const nextParent = parentEntities[index + 1];
                            if (nextParent && nextParent.filterByParent === parentConfig.type) {
                                loadParentEntities(nextParent);
                            }
                        }}
                        options={filteredOptions.map((entity) => ({
                            value: entity[parentConfig.valueField],
                            label: entity[parentConfig.labelField] || entity[parentConfig.valueField]
                        }))}
                        filterOption={(input, option) => 
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {filteredOptions.length} {parentConfig.label.toLowerCase()}(s) available
                    </Text>
                </div>
                );
            })}
            </div>
        </Card>
    );
};
