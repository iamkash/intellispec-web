import { Card } from 'antd';
import React from 'react';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';
import { safePdfValue } from '../utils/pdfValueExtractor';

// Lazy-load heavy widgets to reduce initial bundle size
const PDFGeneratorWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.PDFGeneratorWidget }))) as React.LazyExoticComponent<React.ComponentType<any>>;

interface PDFStepProps {
  config: AIAnalysisWizardConfig;
  sections: any[];
  wizardData: AIAnalysisWizardData;
}

export const PDFStep: React.FC<PDFStepProps> = ({
  config,
  sections,
  wizardData
}) => {
  // Build generic metadata-driven sections from wizard content
  const pdfStyling = (config.steps.pdf.reportConfig as any)?.pdfStyling;
  const contentSections: any[] = [];
  let order = 1;
  
  (sections || []).forEach((s, index) => {
    // Skip voice and raw image capture; allow vision analysis if metadata requests inclusion
    const isVoice = (s as any).sectionType === 'voice';
    const isImage = (s as any).sectionType === 'image';
    const isVision = Boolean((s as any).imageAnalysisPrompt);
    
    if (isVoice || isImage) return;
    
    // If it's the vision analysis section and includeInPdf is true, include overview and optional images
    if (isVision && (s as any).includeInPdf === true) {
      const pdfCfg = (s as any).pdf || {};
      const includeOverview = pdfCfg.includeOverview !== false;
      const includeImages = pdfCfg.includeImages === true;
      
      if (includeOverview) {
        const ov = String(((wizardData.sections || [])[index] as any)?.imageAnalysis?.overview || '');
        if (ov) {
          // Extract all Markdown tables and render them as PDF tables
          try {
            const tableRegex = /(^|\n)\|[^\n]+\|\n\|[\-:\|\s]+\|[\s\S]*?(?=\n\n|$)/g;
            const matches = ov.match(tableRegex) || [];
            matches.forEach((block: string, tIdx: number) => {
              try {
                const lines = block.trim().split('\n').map(l => l.trim());
                const headerCells = (lines[0] || '').split('|').map(s => s.trim()).filter(Boolean);
                const rows = lines.slice(2).map(line => line.split('|').map(s => s.trim()).filter(Boolean)).filter(r => r.length === headerCells.length);
                if (headerCells.length > 0 && rows.length > 0) {
                  const columns = headerCells.map((h, i) => ({ header: h, key: `c${i}` }));
                  const data = rows.map(r => Object.fromEntries(r.map((v, i) => [`c${i}`, v])));
                  contentSections.push({ 
                    id: String(s.id) + `:table-${tIdx}`, 
                    title: (s.title || 'Analysis') + ` (Table ${tIdx + 1})`, 
                    includeInPdf: true, 
                    order: order++, 
                    content: { type: 'table', columns, data } 
                  });
                }
              } catch {}
            });
            // Remove tables from the narrative text to avoid duplication
            const cleaned = ov.replace(tableRegex, '').trim();
            if (cleaned) {
              contentSections.push({ 
                id: String(s.id) + ':overview', 
                title: s.title || 'Image Analysis', 
                includeInPdf: true, 
                order: order++, 
                content: { type: 'text', template: cleaned } 
              });
            }
          } catch {
            // Fallback: include raw text if parsing fails
            contentSections.push({ 
              id: String(s.id) + ':overview', 
              title: s.title || 'Image Analysis', 
              includeInPdf: true, 
              order: order++, 
              content: { type: 'text', template: ov } 
            });
          }
        }
      }
      
      if (includeImages) {
        // Prefer images from referenced capture section, else from this section's data
        const imagesDataPath = pdfCfg.imagesDataPath as string | undefined;
        let imgs: any[] = [];
        
        if (imagesDataPath) {
          try {
            // resolve path sections[sectionId].images
            const match = imagesDataPath.match(/^sections\[(.*?)\]\.images$/);
            if (match) {
              const secId = match[1];
              const secIdx = (sections || []).findIndex(ss => (ss as any)?.id === secId);
              if (secIdx >= 0) imgs = Array.isArray(((wizardData.sections || [])[secIdx] as any)?.images) ? (((wizardData.sections || [])[secIdx] as any)?.images) : [];
            }
          } catch {}
        }
        
        if (imgs.length === 0) {
          imgs = Array.isArray(((wizardData.sections || [])[index] as any)?.images) ? (((wizardData.sections || [])[index] as any)?.images) : [];
        }
        
        // Fallback: If no images found in sections, use the main imageData from the widget
        if (imgs.length === 0 && wizardData.imageData && wizardData.imageData.length > 0) {
          imgs = wizardData.imageData;
        }
        
        
        const mapped = (imgs || []).map((it: any) => ({
          url: it.url,
          name: it.name,
          drawingData: it.drawingData
        }));
        
        // CRITICAL FIX: Implement 6 equal-sized images per page by chunking images
        const imagesPerPage = 6;
        const imageChunks = [];
        
        for (let i = 0; i < mapped.length; i += imagesPerPage) {
          imageChunks.push(mapped.slice(i, i + imagesPerPage));
        }
        
        
        // Create a separate content section for each chunk (page)
        imageChunks.forEach((chunk, chunkIndex) => {
          const content: any = { 
            type: 'image', 
            data: chunk,
            // CRITICAL: Small equal sizing to fit 6 images vertically on one page
            width: 80, // Fixed width in mm 
            height: 40, // Fixed height in mm (2:1 aspect ratio to save vertical space)
            fit: 'cover', // Crop to fit the rectangle
            align: 'center',
            widthPercent: 0.4, // 40% of content width per image
            heightPx: 80 // Small fixed height to fit 6 on page (6 * 80px = 480px total)
          };
          
          const pageTitle = imageChunks.length > 1 
            ? `${s.title || 'Images'} (Page ${chunkIndex + 1} of ${imageChunks.length})`
            : (s.title || 'Images');
          
          
          contentSections.push({ 
            id: String(s.id) + `:images-page-${chunkIndex}`, 
            title: pageTitle, 
            includeInPdf: true, 
            order: order++, 
            content 
          });
        });
      }
      return;
    }

    const secData = ((wizardData.sections || [])[index] as any) || {};
    const title = s.title || s.id;
    
    // CRITICAL FIX: For existing inspections, check both section formData and globalFormData
    const sectionFormData = secData.formData || {};
    const globalFormData = (wizardData as any)?.globalFormData || {};
    const combinedFormData = { ...globalFormData, ...sectionFormData };
    
    
    // Prefer grid as table
    if ((s as any).grid) {
      const gridCfg = (s as any).grid as any;
      const existingRows = Array.isArray(combinedFormData[gridCfg.dataKey]) ? combinedFormData[gridCfg.dataKey] : [];
      
      // Fallback: derive rows from selected image analysis recommendations if none in formData
      const deriveRowsFromAnalysis = (): any[] => {
        try {
          const srcId = (s as any).resourcesFromSectionId || gridCfg.sourceSectionId || 'image_analysis';
          const srcIdx = (sections || []).findIndex(ss => (ss as any)?.id === srcId);
          if (srcIdx < 0) return [];
          const src = ((wizardData.sections || [])[srcIdx] || {}) as any;
          const recs = Array.isArray(src?.imageAnalysis?.suggestions) ? src.imageAnalysis.suggestions : [];
          const ids = Array.isArray(src?.imageAnalysis?.selectedSuggestionIds) ? src.imageAnalysis.selectedSuggestionIds : [];
          const picked = (ids.length > 0
            ? ids.map((id: string) => recs.find((r: any) => String(r.id) === String(id))).filter(Boolean)
            : recs);
          return picked.flatMap((r: any, i: number) => (Array.isArray(r.resources) ? r.resources : []).map((res: any, j: number) => ({
            id: String(res.id || `${i}-${j}`),
            name: String(res.name || ''),
            type: res.type ? String(res.type) : '',
            quantity: res.quantity ?? '',
            notes: res.notes ? String(res.notes) : ''
          })));
        } catch { return []; }
      };
      
      const rows = existingRows.length > 0 ? existingRows : deriveRowsFromAnalysis();
      const columns = (gridCfg.columns || []).map((c: any) => ({ header: c.title || c.key, key: c.key }));
      
      
      // CRITICAL FIX: Only include grid sections that have data to prevent blank pages
      if (rows.length > 0) {
        contentSections.push({ 
          id: String(s.id), 
          title, 
          includeInPdf: true, 
          order: order++, 
          content: { type: 'table', columns, data: rows } 
        });
      }
      return;
    }
    
    // Render forms either as grid (label on top), variable-span grid honoring field spans, or as labeled text
    if ((s as any).form?.groups && (s as any).form.groups.length > 0) {
      const formData = combinedFormData;
      const pdfLayout = (s as any).pdfLayout;
      const allFields: any[] = [];
      (s as any).form.groups.forEach((g: any) => { (g.fields || []).forEach((f: any) => allFields.push(f)); });
      
      if (pdfLayout && String(pdfLayout.type) === 'grid') {
        const columnsCount = Math.max(1, Number(pdfLayout.columns || 4));
        // Provide structured items for PDF widget label-top grid rendering
        const items: Array<{ label: string; value: string }> = allFields.map((f: any) => {
          const raw = formData[f.id];
          const val = safePdfValue(raw, f.type);
          const label = String(f.label || f.id);
          return { label, value: val };
        });
        contentSections.push({ 
          id: String(s.id), 
          title, 
          hideHeader: (s as any).hideHeaderInPdf === true, 
          includeInPdf: true, 
          order: order++, 
          content: { type: 'labelTopGrid', columnsCount, items, labelValueSpacing: 2, gap: 4, cellPadding: 2 } 
        });
      } else if (!pdfLayout || String(pdfLayout.type || '') === '') {
        // No pdfLayout: honor field spans to create a variable-span grid
        // Convert fields into rows totaling 24 units using their lgSpan or default 12
        const rows: Array<Array<{ label: string; value: string; span: number }>> = [];
        let currentRow: Array<{ label: string; value: string; span: number }> = [];
        let used = 0;
        const pushRow = () => { if (currentRow.length > 0) { rows.push(currentRow); currentRow = []; used = 0; } };
        
        for (const f of allFields) {
          const span = Math.min(24, Math.max(1, Number((f as any).lgSpan ?? ((f as any).type === 'textarea' ? 24 : 12))));
          const raw = formData[f.id];
          
          // Use safe PDF value extractor for all field types
          const val = safePdfValue(raw, (f as any).type);
          
          const cell = { label: String(f.label || f.id), value: val, span };
          if (used + span > 24) { pushRow(); }
          currentRow.push(cell); used += span;
          if (used === 24) { pushRow(); }
        }
        pushRow();
        contentSections.push({ 
          id: String(s.id), 
          title, 
          hideHeader: (s as any).hideHeaderInPdf === true, 
          includeInPdf: true, 
          order: order++, 
          content: { type: 'formGrid', rows } 
        });
      } else {
        // Fallback: labeled text block (include fields even when value is empty)
        const lines: string[] = [];
        allFields.forEach((f: any) => {
          const raw = formData[f.id];
          
          // Use safe PDF value extractor for all field types
          const val = safePdfValue(raw, f.type);
          
          lines.push(`${f.label || f.id}: ${val}`);
        });
        const template = lines.join('\n');
        contentSections.push({ 
          id: String(s.id), 
          title, 
          includeInPdf: true, 
          order: order++, 
          content: { type: 'text', template } 
        });
      }
    }
  });

  const companyName = (pdfStyling as any)?.header?.companyName || 'IntelliSpec';
  const companyAddress = (pdfStyling as any)?.header?.companyAddress || '';

  const pdfMetadata = { 
    header: { 
      title: String(config.steps.pdf.title || config.title || 'Report'), 
      companyName, 
      companyAddress 
    }, 
    pdfStyling, 
    sections: contentSections 
  } as any;

  // Minimal header info; widget will use defaults for missing fields
  const valueForPdf = {
    reportTitle: String(config.steps.pdf.title || config.title || 'Report'),
    location: '',
    inspectorName: '',
    inspectorId: '',
    inspectionDate: '',
    inspectionTime: '',
    template: 'standard'
  } as any;

  return (
    <Card className="glass-card wizard-card pdf-step" title={<span>{config.steps.pdf.title}</span>}>
      <React.Suspense fallback={null}>
        <PDFGeneratorWidget
          id={config.steps.pdf.id || 'pdf-generator'}
          metadata={pdfMetadata}
          gadgetData={valueForPdf}
        />
      </React.Suspense>
    </Card>
  );
};
