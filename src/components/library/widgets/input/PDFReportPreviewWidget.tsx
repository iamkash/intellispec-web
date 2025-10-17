/**
 * PDF Report Preview Widget - Professional API 510 Inspection Report Generator
 * 
 * A generic PDF report generator that creates professional inspection reports
 * based on wizard section metadata. Supports any wizard type with logical flow.
 */

import { DownloadOutlined, FilePdfOutlined, PrinterOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useCallback, useEffect, useState } from 'react';

const { Title, Text } = Typography;

export interface PDFReportPreviewWidgetProps {
  id: string;
  label?: string;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  
  // Report configuration
  reportTitle?: string;
  reportSubtitle?: string;
  companyName?: string;
  companyLogo?: string;
  inspectorName?: string;
  inspectionDate?: string;
  vesselId?: string;
  vesselName?: string;
  
  // Form data - this should contain the actual form values
  formData?: Record<string, any>;
  
  // Section data
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    groups?: Array<{
      id: string;
      title: string;
      fields?: Array<{
        id: string;
        title: string;
        value: any;
        type: string;
      }>;
    }>;
  }>;
  
  // PDF options
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Customization
  theme?: 'light' | 'dark';
  showPreview?: boolean;
  autoGenerate?: boolean;
}

export const PDFReportPreviewWidget: React.FC<PDFReportPreviewWidgetProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  style,
  
  // Report configuration
  reportTitle = 'API 510 Pressure Vessel Inspection Report',
  reportSubtitle = 'Comprehensive Inspection Documentation',
  companyName = 'intelliSPEC Inspection Services',
  companyLogo,
  inspectorName,
  inspectionDate,
  vesselId,
  vesselName,
  
  // Form data - this should contain the actual form values
  formData = {},
  
  // Section data
  sections = [],
  
  // PDF options
  pageSize = 'a4',
  orientation = 'portrait',
  margins = { top: 20, bottom: 20, left: 20, right: 20 },
  
  // Customization
  theme = 'light',
  showPreview = true,
  autoGenerate = false
}) => {
  // Get form data from context or props
  const [processedSections, setProcessedSections] = useState<any[]>([]);

  // Load real section data from the wizard configuration
  useEffect(() => {
    const loadSectionData = async () => {
      try {
        // Define the section URLs based on the API 510 inspection wizard
        const sectionUrls = [
          'api-510-sections/vessel-identification.json',
          'api-510-sections/safety-preparation.json',
          'api-510-sections/visual-inspection.json',
          'api-510-sections/measurements-tests.json',
          'api-510-sections/findings-assessment.json',
          'api-510-sections/documentation-report.json'
        ];

        const loadedSections = [];

        for (const sectionUrl of sectionUrls) {
          try {
            const baseUrl = window.location.origin;
            const fullUrl = `${baseUrl}/data/workspaces/inspection/${sectionUrl}`;
const response = await fetch(fullUrl);
            if (!response.ok) {
              console.warn(`[PDF Widget] Failed to load section ${sectionUrl}: ${response.status}`);
              continue;
            }

            const rawData = await response.json();
// Process the section data
            if (Array.isArray(rawData)) {
              // Find the section definition
              const sectionDef = rawData.find(item => item.type === 'section');
              if (!sectionDef) continue;

              // Find all groups
              const groups = rawData.filter(item => item.type === 'group');
              
              // Find all fields
              const fields = rawData.filter(item => 
                item.type && item.type !== 'section' && item.type !== 'group' && item.sectionId
              );

              // Organize fields by group
              const groupsWithFields = groups.map(group => {
                const groupFields = fields.filter(field => field.groupId === group.id);
                return {
                  id: group.id,
                  title: group.title,
                  description: group.description,
                  fields: groupFields.map(field => {
                    const fieldValue = formData[field.id] || field.defaultValue || 'N/A';
                    
                    // Handle signature fields specially
                    if (field.type === 'signature' && fieldValue && typeof fieldValue === 'object' && fieldValue.dataURL) {
                      return {
                        id: field.id,
                        title: field.title,
                        label: field.label,
                        type: field.type,
                        value: fieldValue.dataURL, // Use the dataURL for display
                        signatureData: fieldValue // Keep the full signature data
                      };
                    }
                    
                    return {
                      id: field.id,
                      title: field.title,
                      label: field.label,
                      type: field.type,
                      value: fieldValue
                    };
                  })
                };
              });

              loadedSections.push({
                id: sectionDef.id,
                title: sectionDef.title,
                description: sectionDef.description,
                groups: groupsWithFields
              });
            }
          } catch (error) {
            console.error(`[PDF Widget] Error loading section ${sectionUrl}:`, error);
          }
        }
console.log(`[PDF Widget] Form data available:`, formData);
setProcessedSections(loadedSections);
        
      } catch (error) {
        console.error('[PDF Widget] Error loading section data:', error);
        // Fallback to empty sections
        setProcessedSections([]);
      }
    };

    loadSectionData();
  }, [inspectorName, inspectionDate, formData]); // Added formData to dependencies
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Generate PDF report
  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = margins.left;
      const marginRight = margins.right;
      let yPosition = margins.top;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(reportSubtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Report Information Table
      const reportInfo = [
        ['Inspection Date:', inspectionDate || 'N/A'],
        ['Inspector Name:', inspectorName || 'N/A'],
        ['Vessel ID:', vesselId || 'N/A'],
        ['Vessel Name:', vesselName || 'N/A'],
        ['Company:', companyName],
        ['Report Generated:', new Date().toLocaleDateString()]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Report Information', '']],
        body: reportInfo,
        theme: 'grid',
        headStyles: { fillColor: [51, 51, 51], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 60 }
        },
        margin: { left: marginLeft, right: marginRight }
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 30;

      // Sections - filter out empty sections before processing
      const sectionsWithContent = processedSections.filter(section => {
        // Check if section has any meaningful content
        if (section.type === 'grid' && section.gridData) {
          const rows = Array.isArray(section.gridData) ? section.gridData : [];
          return rows.length > 0 && rows.some((row: any) => Object.values(row).some((val: any) => val && String(val).trim().length > 0));
        }
        if (section.type === 'text' && section.content) {
          return String(section.content).trim().length > 0;
        }
        if (section.type === 'image' && section.imageData) {
          return true; // Always include images if they exist
        }
        // For other types or missing data, default to including them
        return true;
      });

      sectionsWithContent.forEach((section, sectionIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margins.top;
        }

        // Section Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sectionIndex + 1}. ${section.title}`, marginLeft, yPosition);
        yPosition += 6;

        if (section.description) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text(section.description, marginLeft, yPosition);
          yPosition += 5;
        }

        // Groups within section
        section.groups?.forEach((group: any, groupIndex: number) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margins.top;
          }

          // Group Header
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${sectionIndex + 1}.${groupIndex + 1} ${group.title}`, marginLeft + 5, yPosition);
          yPosition += 5;

          // Fields in group
          const fieldData = group.fields?.map((field: any) => {
            let displayValue = field.value;
            
            // Format different field types
            switch (field.type) {
              case 'radio':
              case 'select':
                displayValue = Array.isArray(field.value) ? field.value.join(', ') : field.value;
                break;
              case 'checkbox':
                displayValue = Array.isArray(field.value) ? field.value.join(', ') : (field.value ? 'Yes' : 'No');
                break;
              case 'date':
                displayValue = field.value ? new Date(field.value).toLocaleDateString() : 'N/A';
                break;
              case 'textarea':
                displayValue = field.value || 'N/A';
                break;
              case 'signature':
                // Handle signature fields - add signature image to PDF
                const signatureDataURL = typeof field.value === 'object' && field.value?.dataURL ? field.value.dataURL : field.value;
                if (signatureDataURL && signatureDataURL.startsWith('data:image/')) {
                  try {
                    // Add signature image to PDF immediately
                    const imgWidth = 80;
                    const imgHeight = 40; // Fixed height for signatures
                    
                    // Check if we need a new page
                    if (yPosition + imgHeight > pageHeight - 40) {
                      doc.addPage();
                      yPosition = margins.top;
                    }
                    
                    // Add signature image
                    doc.addImage(signatureDataURL, 'PNG', marginLeft + 10, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + 5;
                    
                    // Add signature metadata
                    const signatureObj = typeof field.value === 'object' ? field.value : null;
                    const signedBy = signatureObj?.signedBy || 'Unknown';
                    const timestamp = signatureObj?.timestamp ? new Date(signatureObj.timestamp).toLocaleString() : 'Unknown time';
                    displayValue = `Digitally signed by: ${signedBy} on ${timestamp}`;
                  } catch (error) {
                    console.error('Error adding signature to PDF:', error);
                    displayValue = 'Signature (error loading)';
                  }
                } else {
                  displayValue = 'No signature provided';
                }
                break;
              case 'inspection-findings':
                displayValue = field.value?.length > 0 ? `${field.value.length} finding(s) recorded` : 'No findings';
                break;
              case 'document-upload':
                displayValue = field.value?.length > 0 ? `${field.value.length} document(s) uploaded` : 'No documents';
                break;
              default:
                // Handle any remaining signature objects that didn't match the signature case
                if (typeof field.value === 'object' && field.value?.dataURL) {
                  const signedBy = field.value.signedBy || 'Unknown';
                  const timestamp = field.value.timestamp ? new Date(field.value.timestamp).toLocaleString() : 'Unknown time';
                  displayValue = `Digitally signed by: ${signedBy} on ${timestamp}`;
                } else {
                  displayValue = field.value || 'N/A';
                }
            }
            
            return [field.title, displayValue];
          }) || [];

          if (fieldData.length > 0) {
            autoTable(doc, {
              startY: yPosition,
              body: fieldData,
              theme: 'plain',
              styles: { fontSize: 9 },
              columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 50 }
              },
              margin: { left: marginLeft + 10, right: marginRight }
            });
            yPosition = (doc as any).lastAutoTable?.finalY + 3 || yPosition + 20;
          }
        });

        // Section separator
        if (sectionIndex < sections.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
          yPosition += 5;
        }
      });

      // Footer
      const footerY = pageHeight - margins.bottom;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by ${companyName} on ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });

      // Generate PDF URL for preview
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      console.log('✅ PDF report generated successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('❌ Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  }, [
    processedSections,
    reportTitle,
    reportSubtitle,
    companyName,
    inspectorName,
    inspectionDate,
    vesselId,
    vesselName,
    pageSize,
    orientation,
    margins,
    sections
  ]);

  // Download PDF
  const downloadPDF = useCallback(() => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [pdfUrl, reportTitle]);

  // Print PDF
  const printPDF = useCallback(() => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  }, [pdfUrl]);

  // Auto-generate on mount if enabled
  useEffect(() => {
    if (autoGenerate && processedSections.length > 0) {
      generatePDF();
    }
  }, [autoGenerate, processedSections, generatePDF]);

  return (
    <div className={`pdf-report-preview-widget ${className}`} style={style}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {label && (
              <Text strong={required}>
                {label}
                {required && <span style={{ color: '#ff4d4f' }}>*</span>}
              </Text>
            )}
            <div>
              <Title level={4} style={{ margin: 0, marginTop: 4 }}>
                {reportTitle}
              </Title>
              <Text type="secondary">{reportSubtitle}</Text>
            </div>
          </div>
          
          <Space>
                         <Button
               type="primary"
               icon={<FilePdfOutlined />}
               onClick={generatePDF}
               loading={isGenerating}
               disabled={disabled || processedSections.length === 0}
             >
               Generate Report
             </Button>
            
            {pdfUrl && (
              <>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={downloadPDF}
                  disabled={disabled}
                >
                  Download
                </Button>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={printPDF}
                  disabled={disabled}
                >
                  Print
                </Button>
              </>
            )}
          </Space>
        </div>

        {/* Report Summary */}
        <Card size="small" title="Report Summary">
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Sections:</Text>
              <br />
              <Text>{processedSections.length}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Total Groups:</Text>
              <br />
              <Text>{processedSections.reduce((acc, section) => acc + (section.groups?.length || 0), 0)}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Total Fields:</Text>
              <br />
              <Text>
                {processedSections.reduce((acc: number, section: any) => 
                  acc + (section.groups?.reduce((groupAcc: number, group: any) => 
                    groupAcc + (group.fields?.length || 0), 0) || 0), 0
                )}
              </Text>
            </Col>
            <Col span={6}>
              <Text strong>Status:</Text>
              <br />
              <Tag color={pdfUrl ? 'green' : 'Pending'}>
                {pdfUrl ? 'Generated' : 'Pending'}
              </Tag>
            </Col>
          </Row>
        </Card>

        {/* PDF Preview */}
        {showPreview && pdfUrl && (
          <Card size="small" title="PDF Preview">
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: 4, 
              height: 600, 
              overflow: 'hidden' 
            }}>
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="PDF Preview"
              />
            </div>
          </Card>
        )}

        {/* Section Overview */}
        <Card size="small" title="Section Overview">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {processedSections.map((section, index) => (
              <div key={section.id} style={{ 
                padding: 8, 
                backgroundColor: '#fafafa', 
                borderRadius: 4,
                border: '1px solid #f0f0f0'
              }}>
                <Text strong>{index + 1}. {section.title}</Text>
                {section.description && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {section.description}
                    </Text>
                  </div>
                )}
                {section.groups && section.groups.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Groups: {section.groups.map((g: any) => g.title).join(', ')}
                    </Text>
                  </div>
                )}
                
                {/* Show signature previews if any */}
                {section.groups && section.groups.some((group: any) => 
                  group.fields && group.fields.some((field: any) => field.type === 'signature' && field.value && field.value.startsWith('data:image/'))
                ) && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                      Signatures:
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {section.groups.map((group: any) => 
                        group.fields && group.fields.map((field: any) => 
                          field.type === 'signature' && field.value && field.value.startsWith('data:image/') ? (
                            <div key={field.id} style={{ 
                              border: '1px solid #d9d9d9', 
                              borderRadius: 4, 
                              padding: 4,
                              backgroundColor: 'white'
                            }}>
                              <Text style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>
                                {field.title}
                              </Text>
                              <img 
                                src={field.value} 
                                alt={`Signature: ${field.title}`}
                                style={{ 
                                  width: 60, 
                                  height: 30, 
                                  objectFit: 'contain',
                                  border: '1px solid #f0f0f0'
                                }}
                              />
                            </div>
                          ) : null
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default PDFReportPreviewWidget; 
