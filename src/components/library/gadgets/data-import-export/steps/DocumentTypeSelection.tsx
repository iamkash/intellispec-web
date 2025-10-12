import * as Icon from '@ant-design/icons';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';
import { DocumentTypeOption } from '../types';

const { Text } = Typography;

interface DocumentTypeSelectionProps {
  options: DocumentTypeOption[];
  selectedOption: DocumentTypeOption | null;
  onSelect: (option: DocumentTypeOption) => void;
  title?: string;
  description?: string;
}

export const DocumentTypeSelection: React.FC<DocumentTypeSelectionProps> = ({
  options,
  selectedOption,
  onSelect,
  title = 'What are you importing?',
  description = 'Select the type of data you want to import. Our AI will intelligently map your Excel columns.'
}) => {
  return (
    <div className="step-card">
      {/* Slim Description */}
      <div style={{ marginBottom: 0, textAlign: 'center', padding: '8px 12px', background: 'hsl(var(--muted) / 0.15)', borderBottom: '1px solid hsl(var(--border))' }}>
        <Text style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', lineHeight: '1.3' }}>
          {description}
        </Text>
      </div>

      <div className="step-card-body">
        <div className="document-type-grid">
          {options.map((option) => {
            const IconComponent = (Icon as any)[option.icon];
            const isSelected = selectedOption?.value === option.value;

            return (
              <div
                key={option.value}
                className={`document-type-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(option)}
              >
                <div className="document-type-icon-container">
                  {IconComponent && <IconComponent className="document-type-icon" />}
                </div>
                <h4>{option.label}</h4>
                <p>{option.description}</p>
                {isSelected && (
                  <div className="document-type-selected-badge">
                    <CheckCircleOutlined className="document-type-selected-icon" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
