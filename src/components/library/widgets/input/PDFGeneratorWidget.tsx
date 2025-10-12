/**
 * PDFGeneratorWidget (Generic, metadata-only)
 * - Inputs: metadata (sections, styling) and gadgetData (values)
 * - Renders ONLY sections where includeInPdf === true, in order
 * - Supports content types: text, rawtext, table, image
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React from 'react';

export type GenericPdfSection = {
  id?: string;
  title: string;
  includeInPdf?: boolean;
  order?: number;
  hideHeader?: boolean;
  content: {
    type: 'text' | 'rawtext' | 'table' | 'image' | 'labelTopGrid' | 'formGrid';
    // text
    template?: string;
    // table
    columns?: Array<{ header: string; key: string }>;
    data?: any[];
    dataPath?: string;
    // image
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'stretch';
    align?: 'left' | 'center' | 'right';
    widthPercent?: number; // 0..1 of available content width
    heightPx?: number; // desired height in pixels at current DPI
    // labelTopGrid
    columnsCount?: number;
    items?: Array<{ label: string; value: string }>;
    labelValueSpacing?: number;
    labelFontSize?: number;
    valueFontSize?: number;
    gap?: number;
    cellPadding?: number;
    // formGrid (variable spans per cell)
    rows?: Array<Array<{ label: string; value: string; span: number }>>;
  };
};

export type GenericPdfMetadata = {
  header?: { title?: string; companyName?: string; companyAddress?: string };
  pdfStyling?: {
    header?: { backgroundColor?: [number, number, number]; textColor?: [number, number, number]; fontSize?: number; showMainTitle?: boolean; showHeaderTitle?: boolean };
    footer?: { textColor?: [number, number, number]; fontSize?: number; leftText?: string; centerText?: string; rightText?: string };
    sections?: { headerFontSize?: number; contentFontSize?: number; lineSpacing?: number; margins?: { left?: number; right?: number } };
    tables?: { headerBackground?: [number, number, number]; headerTextColor?: [number, number, number]; headerFontSize?: number; contentFontSize?: number; cellPadding?: number };
    images?: { dpi?: number; format?: 'JPEG' | 'PNG'; quality?: number; backgroundColor?: [number, number, number]; fit?: 'contain' | 'cover' | 'stretch'; align?: 'left' | 'center' | 'right'; widthPercent?: number; heightPx?: number };
  };
  sections: GenericPdfSection[];
};

export interface PDFReportData {
  reportTitle?: string;
  location?: string;
  inspectorName?: string;
  inspectorId?: string;
  inspectionDate?: string;
  inspectionTime?: string;
  template?: string;
  [key: string]: any;
}

export interface PDFGeneratorWidgetProps {
  id: string;
  metadata: GenericPdfMetadata;
  gadgetData: PDFReportData;
}

const toPathParts = (path: string): string[] =>
  path
    .replace(/\[\s*(["'])(.*?)\1\s*\]/g, '.$2')
    .replace(/\[\s*(\d+)\s*\]/g, '.$1')
    .split('.')
    .filter(Boolean);

const getByPath = (obj: any, path?: string): any => {
  if (!obj || !path) return undefined;
  const parts = toPathParts(String(path));
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const isIndex = /^\d+$/.test(p);
    cur = isIndex ? cur[Number(p)] : cur[p];
  }
  return cur;
};

/**
 * Normalizes text for PDF rendering by converting Unicode special characters
 * to ASCII equivalents that jsPDF's built-in fonts can handle properly.
 * This prevents weird spacing and character rendering issues.
 * 
 * Enhanced version from AIAnalysisWizardGadget with comprehensive Unicode handling.
 */
const normalizeForPdf = (s: string): string => {
  if (!s) return '';
  return s
    .normalize('NFKC')  // Normalize Unicode composition
    // Non-breaking spaces and special spaces
    .replace(/\u00A0/g, ' ')      // Non-breaking space -> regular space
    .replace(/\u202F/g, ' ')      // Narrow non-breaking space -> space
    .replace(/\u2007/g, ' ')      // Figure space -> space
    .replace(/\u2008/g, ' ')      // Punctuation space -> space
    .replace(/\u2009/g, ' ')      // Thin space -> space
    .replace(/\u200A/g, ' ')      // Hair space -> space
    // Hyphens and dashes
    .replace(/\u2011/g, '-')      // Non-breaking hyphen -> regular hyphen
    .replace(/\u2010/g, '-')      // Hyphen -> regular hyphen
    .replace(/\u2012/g, '-')      // Figure dash -> hyphen
    .replace(/\u2013/g, '-')      // En dash -> hyphen
    .replace(/\u2014/g, '-')      // Em dash -> hyphen
    .replace(/\u2212/g, '-')      // Minus sign -> hyphen
    // Quotes and apostrophes
    .replace(/[\u2018\u2019]/g, "'")  // Left/right single quotes -> apostrophe
    .replace(/[\u201C\u201D]/g, '"')   // Left/right double quotes -> quote
    .replace(/\u201A/g, "'")          // Single low quote -> apostrophe
    .replace(/\u201E/g, '"')          // Double low quote -> quote
    // Other punctuation
    .replace(/\u2026/g, '...')        // Ellipsis -> three dots
    .replace(/\u00B7/g, '·')          // Middle dot (keep as is)
    // Collapse multiple spaces and normalize line endings
    .replace(/[ \t]+/g, ' ')          // Multiple spaces/tabs -> single space
    .replace(/\r\n/g, '\n')           // Windows line endings -> Unix
    .replace(/\r/g, '\n')             // Mac line endings -> Unix
    .trim();
};

/**
 * Enhanced markdown content sanitization for PDF generation
 * Properly handles markdown tables, formatting, and special characters
 */
const sanitizeMarkdownForPdf = (markdown: string): { text: string; tables: Array<{ columns: Array<{ header: string; key: string }>; data: any[] }> } => {
  if (!markdown) return { text: '', tables: [] };

  // Extract and parse markdown tables
  const tableRegex = /\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g;
  const tables: Array<{ columns: Array<{ header: string; key: string }>; data: any[] }> = [];
  let textContent = markdown;
  let match;

  // Extract tables
  while ((match = tableRegex.exec(markdown)) !== null) {
    const [fullMatch, headerRow, bodyRows] = match;
    
    // Parse header
    const headers = headerRow.split('|').map(h => normalizeForPdf(h.trim())).filter(h => h);
    
    // Parse body rows
    const rows = bodyRows.trim().split('\n').map(row => 
      row.split('|').map(cell => normalizeForPdf(cell.trim())).filter(cell => cell)
    ).filter(row => row.length > 0);

    if (headers.length > 0 && rows.length > 0) {
      tables.push({
        columns: headers.map(header => ({ 
          header, 
          key: header.toLowerCase().replace(/[^a-z0-9]/g, '_') 
        })),
        data: rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
            obj[key] = normalizeForPdf(row[index] || '');
          });
          return obj;
        })
      });
    }

    // Remove table from text content
    textContent = textContent.replace(fullMatch, '\n[TABLE_PLACEHOLDER]\n');
  }

  // Clean up markdown formatting from text
  const cleanText = normalizeForPdf(textContent
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/^\s*[-\*\+]\s/gm, '• ') // Convert list items
    .replace(/\[TABLE_PLACEHOLDER\]/g, '') // Remove table placeholders
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
  );

  return { text: cleanText, tables };
};

const interpolate = (template: string, data: any): string => {
  if (!template) return '';
  const interpolated = template.replace(/\{\{\s*([a-zA-Z0-9_\.\-\[\]"']+)\s*\}\}/g, (_m, key) => {
    const val = getByPath(data, key);
    if (val == null) return '';
    return typeof val === 'string' ? val : JSON.stringify(val);
  });
  return normalizeForPdf(interpolated);
};

export const PDFGeneratorWidget: React.FC<PDFGeneratorWidgetProps> = ({ id, metadata, gadgetData }) => {
  const [previewUrl, setPreviewUrl] = React.useState<string>('');

  React.useEffect(() => {
    const generate = async () => {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentBottomY = pageHeight - 25; // keep bottom padding for footer

      const headerCfg = metadata.pdfStyling?.header || {};
      const footerCfg = metadata.pdfStyling?.footer || {};
      const sectionCfg = metadata.pdfStyling?.sections || {};
      const tableCfg = metadata.pdfStyling?.tables || {};

      const addHeader = () => {
        const bg = headerCfg.backgroundColor || [0, 0, 0];
        const tc = headerCfg.textColor || [255, 255, 255];
        const fs = headerCfg.fontSize || 12;
        pdf.setFillColor(bg[0], bg[1], bg[2]);
        pdf.rect(0, 0, 210, 20, 'F');
        pdf.setTextColor(tc[0], tc[1], tc[2]);
        pdf.setFontSize(fs);
        pdf.setFont('helvetica', 'bold');
        const showHeaderTitle = (metadata.pdfStyling as any)?.header?.showHeaderTitle === true;
        const title = metadata.header?.title || '';
        if (showHeaderTitle && title) pdf.text(title, 105, 10, { align: 'center' });
        if (metadata.header?.companyName) {
          pdf.setFontSize(fs - 4);
          pdf.text(metadata.header.companyName, 105, 18, { align: 'center' });
        }
      };

      const addFooter = (pageNumber: number, totalPages: number) => {
        const tc = footerCfg.textColor || [0, 0, 0];
        const fs = footerCfg.fontSize || 6;
        const y = 285;
        pdf.setFontSize(fs);
        pdf.setTextColor(tc[0], tc[1], tc[2]);
        pdf.setFont('helvetica', 'normal');
        if (footerCfg.leftText) pdf.text(footerCfg.leftText, 15, y);
        if (footerCfg.centerText) pdf.text(footerCfg.centerText, 105, y, { align: 'center' });
        if (footerCfg.rightText) pdf.text(footerCfg.rightText.replace('{page}', String(pageNumber)).replace('{pages}', String(totalPages)), 195, y, { align: 'right' });
      };

      const addSectionHeader = (title: string, y: number) => {
        const fs = sectionCfg.headerFontSize || 10;
        const margins = sectionCfg.margins || { left: 15, right: 195 };
        pdf.setFontSize(fs);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.toUpperCase(), margins.left || 15, y);
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);
        pdf.line(margins.left || 15, y + 1, margins.right || 195, y + 1);
      };

      const addText = (rawText: string, y: number, maxWidth = 180) => {
        // Normalize text to handle Unicode special characters
        const text = normalizeForPdf(rawText);
        const fs = sectionCfg.contentFontSize || 8;
        const margins = sectionCfg.margins || { left: 15, right: 195 };
        pdf.setFontSize(fs);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        // Set line height for better readability of dense paragraphs
        pdf.setLineHeightFactor(1.4);
        
        // Ensure proper width calculation
        const actualMaxWidth = Math.min(maxWidth, (margins.right || 195) - (margins.left || 15));
        const lines = pdf.splitTextToSize(text, actualMaxWidth);
        
        // Compute accurate line height in document units (mm)
        const lineHeight = (pdf.getLineHeightFactor() * pdf.getFontSize()) / pdf.internal.scaleFactor;
        const textHeight = Math.max(lineHeight, lines.length * lineHeight);
        
        // Page break if needed before drawing
        if (y + textHeight > contentBottomY) {
          pdf.addPage(); addHeader(); y = 30;
        }
        
        // Reset character and word spacing to prevent issues (if available)
        if (typeof (pdf as any).setCharSpace === 'function') {
          (pdf as any).setCharSpace(0);
        }
        if (typeof (pdf as any).setWordSpace === 'function') {
          (pdf as any).setWordSpace(0);
        }
        
        pdf.text(lines, margins.left || 15, y);
        return textHeight;
      };

      const addMarkdownText = (markdownText: string, y: number, maxWidth = 180) => {
        const margins = sectionCfg.margins || { left: 15, right: 195 };
        const actualMaxWidth = Math.min(maxWidth, (margins.right || 195) - (margins.left || 15));
        let currentY = y;
        
        // Helper function to render text with consistent settings
        const renderTextLine = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', yPos: number, leftMargin: number = margins.left || 15) => {
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          pdf.setTextColor(0, 0, 0);
          pdf.setLineHeightFactor(1.4);
          
          // Always reset spacing for absolute consistency
          if (typeof (pdf as any).setCharSpace === 'function') {
            (pdf as any).setCharSpace(0);
          }
          if (typeof (pdf as any).setWordSpace === 'function') {
            (pdf as any).setWordSpace(0);
          }
          
          // Enhanced normalization for PDF compatibility - more selective approach
          const cleanText = text
            .replace(/\r\n/g, '\n')           // Windows line endings -> Unix
            .replace(/\r/g, '\n')             // Mac line endings -> Unix
            // Handle arrows and special characters
            .replace(/→/g, ' -> ')            // Right arrow -> ASCII arrow
            .replace(/←/g, ' <- ')            // Left arrow -> ASCII arrow
            .replace(/↑/g, ' ^ ')             // Up arrow -> ASCII caret
            .replace(/↓/g, ' v ')             // Down arrow -> ASCII v
            // Handle quotes and punctuation
            .replace(/['']/g, "'")            // Smart quotes -> regular quote
            .replace(/[""]/g, '"')            // Smart quotes -> regular quote
            .replace(/[–—]/g, '-')            // En/em dash -> hyphen
            .replace(/…/g, '...')             // Ellipsis -> three dots
            // Handle degree and other symbols
            .replace(/°/g, 'deg')             // Degree symbol -> deg (no spaces)
            .replace(/±/g, '+/-')             // Plus-minus -> +/-
            .replace(/×/g, 'x')               // Multiplication -> x
            .replace(/÷/g, '/')               // Division -> /
            .replace(/≤/g, '<=')              // Less than or equal
            .replace(/≥/g, '>=')              // Greater than or equal
            .replace(/≠/g, '!=')              // Not equal
            .replace(/≈/g, '~=')              // Approximately equal
            // Handle fractions
            .replace(/½/g, '1/2')             // Half
            .replace(/¼/g, '1/4')             // Quarter
            .replace(/¾/g, '3/4')             // Three quarters
            // Handle superscripts/subscripts commonly used in formulas
            .replace(/²/g, '^2')              // Superscript 2
            .replace(/³/g, '^3')              // Superscript 3
            .replace(/¹/g, '^1')              // Superscript 1
            // Handle currency and other symbols
            .replace(/€/g, 'EUR')             // Euro
            .replace(/£/g, 'GBP')             // Pound
            .replace(/¥/g, 'JPY')             // Yen
            // Handle accented characters by removing accents
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[ç]/g, 'c')
            .replace(/[ÀÁÂÃÄÅ]/g, 'A')
            .replace(/[ÈÉÊË]/g, 'E')
            .replace(/[ÌÍÎÏ]/g, 'I')
            .replace(/[ÒÓÔÕÖ]/g, 'O')
            .replace(/[ÙÚÛÜ]/g, 'U')
            .replace(/[Ñ]/g, 'N')
            .replace(/[Ç]/g, 'C')
            // Only replace truly problematic characters that can't be handled
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, ' ') // Various spaces and punctuation
            .replace(/[\uFEFF\uFFFE\uFFFF]/g, ''); // Remove BOM and other invisible characters
          // Calculate proper width for text wrapping
          const availableWidth = actualMaxWidth - Math.max(0, leftMargin - (margins.left || 15));
          const textLines = pdf.splitTextToSize(cleanText, Math.max(100, availableWidth)); // Ensure minimum width
          pdf.text(textLines, leftMargin, yPos);
          
          const lineHeight = (pdf.getLineHeightFactor() * pdf.getFontSize()) / pdf.internal.scaleFactor;
          return textLines.length * lineHeight;
        };
        
        // Split into lines and process each line
        const lines = markdownText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check for page break
          if (currentY > contentBottomY - 20) {
            pdf.addPage();
            addHeader();
            currentY = 30;
          }
          
          // Handle different markdown elements
          if (line.startsWith('# ')) {
            // H1 Header
            const headerText = line.substring(2);
            const height = renderTextLine(headerText, 16, 'bold', currentY);
            currentY += height + 4;
            
          } else if (line.startsWith('## ')) {
            // H2 Header
            const headerText = line.substring(3);
            const height = renderTextLine(headerText, 14, 'bold', currentY);
            currentY += height + 3;
            
          } else if (line.startsWith('### ')) {
            // H3 Header
            const headerText = line.substring(4);
            const height = renderTextLine(headerText, 12, 'bold', currentY);
            currentY += height + 2;
            
          } else if (line.startsWith('| ') && line.includes(' | ')) {
            // Table row - collect all table rows
            const tableRows = [];
            let j = i;
            while (j < lines.length && (lines[j].startsWith('| ') || lines[j].includes('|'))) {
              if (!lines[j].includes('---')) { // Skip separator rows
                tableRows.push(lines[j]);
              }
              j++;
            }
            
            if (tableRows.length > 0) {
              // Process table
              const tableData = tableRows.map(row => 
                row.split('|').map(cell => cell.trim()).filter(cell => cell)
              );
              
              if (tableData.length > 1) {
                const headers = tableData[0];
                const body = tableData.slice(1);
                
                // Use autoTable for proper table formatting
                autoTable(pdf, {
                  startY: currentY,
                  head: [headers],
                  body: body,
                  theme: 'grid',
                  headStyles: {
                    fillColor: [245, 245, 245],
                    textColor: [50, 50, 50],
                    fontStyle: 'bold',
                    fontSize: 9,
                  },
                  styles: {
                    fontSize: 8,
                    cellPadding: 3,
                  },
                  margin: { left: margins.left || 15 },
                });
                
                currentY = (pdf as any).lastAutoTable.finalY + 6;
              }
              
              i = j - 1; // Skip processed table rows
            }
            
          } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+[\.\)]\s/.test(line)) {
            // Bullet point or numbered list
            let bulletText;
            if (line.startsWith('- ') || line.startsWith('* ')) {
              bulletText = '• ' + line.substring(2);
            } else {
              // Numbered list - keep the number but ensure consistent formatting
              bulletText = line;
            }
            const height = renderTextLine(bulletText, sectionCfg.contentFontSize || 9, 'normal', currentY, (margins.left || 15) + 5);
            currentY += height + 2;
            
          } else if (line.trim() === '') {
            // Empty line - add spacing
            currentY += 3;
            
          } else {
            // Regular text with markdown formatting removed
            let processedLine = line;
            
            // Handle bold text (**text**)
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '$1');
            
            // Handle italic text (*text*)
            processedLine = processedLine.replace(/\*(.*?)\*/g, '$1');
            
            // Handle inline code (`code`)
            processedLine = processedLine.replace(/`(.*?)`/g, '$1');
            
            if (processedLine.trim()) {
              const height = renderTextLine(processedLine, sectionCfg.contentFontSize || 9, 'normal', currentY);
              currentY += height + 2;
            }
          }
        }
        
        return currentY - y;
      };

      addHeader();
      const showMainTitle = (metadata.pdfStyling as any)?.header?.showMainTitle === true;
      if (showMainTitle && metadata.header?.title) {
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(metadata.header.title).toUpperCase(), 105, 35, { align: 'center' });
      }

      let currentY = 45;
      const sections = (metadata.sections || [])
        .filter(s => s.includeInPdf === true)
        .sort((a, b) => (a.order || 0) - (b.order || 0));


      for (const sec of sections) {
        const c = sec.content;
        
        // Check if section has content before rendering
        let hasContent = false;
        
        if (c.type === 'text') {
          const text = interpolate(String(c.template || ''), gadgetData);
          hasContent = text.trim().length > 0;
        } else if (c.type === 'rawtext') {
          const rawText = String(c.template || '');
          hasContent = rawText.trim().length > 0;
        } else if (c.type === 'table') {
          const rowsFromPath = c.dataPath ? getByPath(gadgetData, c.dataPath) : undefined;
          const dataRows: any[] = Array.isArray(rowsFromPath) ? rowsFromPath : (Array.isArray(c.data) ? c.data : []);
          hasContent = dataRows.length > 0;
        } else if (c.type === 'labelTopGrid') {
          const items = c.items || [];
          hasContent = items.some(item => item.value && item.value.trim().length > 0);
        } else if (c.type === 'formGrid') {
          const rows = c.rows || [];
          hasContent = rows.some(row => row.some(cell => cell.value && cell.value.trim().length > 0));
        } else if (c.type === 'image') {
          hasContent = true; // Always show images if they exist
        } else {
          hasContent = true; // Default to showing unknown types
        }
        
        // Skip empty sections
        if (!hasContent) {
          continue;
        }
        
        if (currentY > contentBottomY) { 
          pdf.addPage(); 
          addHeader(); 
          currentY = 30;
        }
        if (!sec.hideHeader) {
          addSectionHeader(sec.title, currentY);
          currentY += 8;
        }
        
        if (c.type === 'text') {
          const text = interpolate(String(c.template || ''), gadgetData);
          // Calculate proper max width based on margins
          const margins = sectionCfg.margins || { left: 15, right: 195 };
          const maxWidth = (margins.right || 195) - (margins.left || 15);
          const h = addText(text, currentY, maxWidth);
          currentY += h + 6;
          // Text section completed
        } else if (c.type === 'rawtext') {
          // Raw text type - render markdown formatting properly
          const markdownText = String(c.template || '');
          // Calculate proper max width based on margins
          const margins = sectionCfg.margins || { left: 15, right: 195 };
          const maxWidth = (margins.right || 195) - (margins.left || 15);
          const h = addMarkdownText(markdownText, currentY, maxWidth);
          currentY += h + 6;
          // Markdown text section completed
        } else if (c.type === 'table') {
          if (currentY > contentBottomY - 20) { 
            pdf.addPage(); 
            addHeader(); 
            currentY = 30;
          }
          const rowsFromPath = c.dataPath ? getByPath(gadgetData, c.dataPath) : undefined;
          const dataRows: any[] = Array.isArray(rowsFromPath) ? rowsFromPath : (Array.isArray(c.data) ? c.data : []);
          const head = [Array.isArray(c.columns) ? c.columns.map(col => normalizeForPdf(col.header)) : []];
          const body = dataRows.map(r => (c.columns || []).map(col => normalizeForPdf(String((r as any)[col.key] ?? ''))));
          
          
          autoTable(pdf, {
            startY: currentY,
            head,
            body,
            theme: 'grid',
            headStyles: {
              fillColor: metadata.pdfStyling?.tables?.headerBackground || [0, 0, 0],
              textColor: metadata.pdfStyling?.tables?.headerTextColor || [255, 255, 255],
              fontStyle: 'bold',
              fontSize: metadata.pdfStyling?.tables?.headerFontSize || 8,
              font: 'helvetica',
            },
            styles: {
              fontSize: metadata.pdfStyling?.tables?.contentFontSize || 7,
              cellPadding: metadata.pdfStyling?.tables?.cellPadding || 3,
              font: 'helvetica',
            },
          });
          
          currentY = (pdf as any).lastAutoTable.finalY + 6;
        } else if (c.type === 'labelTopGrid') {
          try {
            // Manual grid rendering to support bold labels and spacing between label/value
            const margins = sectionCfg.margins || { left: 15, right: 195 };
            const availableWidth = (margins.right || 195) - (margins.left || 15);
            const columns = Math.max(1, Number((c as any).columnsCount || 4));
          const gap = Number((c as any).gap || 4);
          const cellPadding = Number((c as any).cellPadding || 2);
          const colWidth = (availableWidth - gap * (columns - 1)) / columns;
          const itemsRaw = Array.isArray((c as any).items) ? (c as any).items as Array<{ label: string; value: string }> : [];
          const items = itemsRaw.map(item => ({
            label: normalizeForPdf(item.label || ''),
            value: normalizeForPdf(item.value || '')
          }));
          
          const labelFs = Number((c as any).labelFontSize || (sectionCfg.contentFontSize || 8) + 1);
          const valueFs = Number((c as any).valueFontSize || sectionCfg.contentFontSize || 8);
          const labelLineHeight = (pdf.getLineHeightFactor() * labelFs) / pdf.internal.scaleFactor;
          const valueLineHeight = (pdf.getLineHeightFactor() * valueFs) / pdf.internal.scaleFactor;
          const spacing = Number((c as any).labelValueSpacing || 2);
          
          let i = 0;
          while (i < items.length) {
            // Calculate row height by max of cells
            let maxCellHeight = 0;
            // Pre-calc heights for this row
            const rowItems = items.slice(i, i + columns);
            for (let ci = 0; ci < rowItems.length; ci++) {
              const it = rowItems[ci];
              // label
              pdf.setFontSize(labelFs);
              pdf.setFont('helvetica', 'bold');
              const labelLines = pdf.splitTextToSize(String(it.label || ''), colWidth - cellPadding * 2);
              const labelHeight = Math.max(labelLineHeight, labelLines.length * labelLineHeight);
              // value
              pdf.setFontSize(valueFs);
              pdf.setFont('helvetica', 'normal');
              const valueLines = pdf.splitTextToSize(String(it.value || ''), colWidth - cellPadding * 2);
              const valueHeight = Math.max(valueLineHeight, valueLines.length * valueLineHeight);
              const cellHeight = cellPadding + labelHeight + spacing + valueHeight + cellPadding;
              if (cellHeight > maxCellHeight) maxCellHeight = cellHeight;
            }
            // Page break if needed
            if (currentY + maxCellHeight > contentBottomY) {
              pdf.addPage();
              addHeader();
              currentY = 30;
              if (!sec.hideHeader) {
                addSectionHeader(sec.title, currentY);
                currentY += 8;
              }
            }
            // Draw cells
            for (let ci = 0; ci < rowItems.length; ci++) {
              const it = rowItems[ci];
              const x = (margins.left || 15) + ci * (colWidth + gap);
              let y = currentY + cellPadding;
              pdf.setFontSize(labelFs);
              pdf.setFont('helvetica', 'bold');
              const labelLines = pdf.splitTextToSize(String(it.label || ''), colWidth - cellPadding * 2);
              pdf.text(labelLines, x + cellPadding, y);
              y += Math.max(labelLineHeight, labelLines.length * labelLineHeight) + spacing;
              pdf.setFontSize(valueFs);
              pdf.setFont('helvetica', 'normal');
              const valueLines = pdf.splitTextToSize(String(it.value || ''), colWidth - cellPadding * 2);
              pdf.text(valueLines, x + cellPadding, y);
            }
            currentY += maxCellHeight + 4;
            i += columns;
          }
        } catch (labelGridError) {
          currentY += 20;
        }
        } else if (c.type === 'formGrid') {
          // Variable-span grid: rows of cells with span out of 24
          const margins = sectionCfg.margins || { left: 15, right: 195 };
          const availableWidth = (margins.right || 195) - (margins.left || 15);
          const gap = Number((c as any).gap || 4);
          const cellPadding = Number((c as any).cellPadding || 2);
          const labelFs = Number((c as any).labelFontSize || (sectionCfg.contentFontSize || 8) + 1);
          const valueFs = Number((c as any).valueFontSize || sectionCfg.contentFontSize || 8);
          const labelLineHeight = (pdf.getLineHeightFactor() * labelFs) / pdf.internal.scaleFactor;
          const valueLineHeight = (pdf.getLineHeightFactor() * valueFs) / pdf.internal.scaleFactor;
          const spacing = Number((c as any).labelValueSpacing || 2);
          const rowsRaw = Array.isArray((c as any).rows) ? (c as any).rows as Array<Array<{ label: string; value: string; span: number }>> : [];
          const rows = rowsRaw.map(row => row.map(cell => ({
            label: normalizeForPdf(cell.label || ''),
            value: normalizeForPdf(cell.value || ''),
            span: cell.span
          })));
          const unitWidth = availableWidth / 24;
          for (const row of rows) {
            // Compute row height by examining each cell content
            let maxCellHeight = 0;
            for (let ci = 0; ci < row.length; ci++) {
              const cell = row[ci];
              const width = unitWidth * Math.max(1, Number(cell.span || 24)) - gap;
              pdf.setFontSize(labelFs);
              pdf.setFont('helvetica', 'bold');
              const labelLines = pdf.splitTextToSize(String(cell.label || ''), width - cellPadding * 2);
              const labelHeight = Math.max(labelLineHeight, labelLines.length * labelLineHeight);
              pdf.setFontSize(valueFs);
              pdf.setFont('helvetica', 'normal');
              const valueLines = pdf.splitTextToSize(String(cell.value || ''), width - cellPadding * 2);
              const valueHeight = Math.max(valueLineHeight, valueLines.length * valueLineHeight);
              const cellHeight = cellPadding + labelHeight + spacing + valueHeight + cellPadding;
              if (cellHeight > maxCellHeight) maxCellHeight = cellHeight;
            }
            // Page break
            if (currentY + maxCellHeight > contentBottomY) {
              pdf.addPage();
              addHeader();
              currentY = 30;
              if (!sec.hideHeader) { addSectionHeader(sec.title, currentY); currentY += 8; }
            }
            // Draw cells
            let x = margins.left || 15;
            for (let ci = 0; ci < row.length; ci++) {
              const cell = row[ci];
              const width = unitWidth * Math.max(1, Number(cell.span || 24)) - gap;
              let y = currentY + cellPadding;
              pdf.setFontSize(labelFs);
              pdf.setFont('helvetica', 'bold');
              const labelLines = pdf.splitTextToSize(String(cell.label || ''), width - cellPadding * 2);
              pdf.text(labelLines, x + cellPadding, y);
              y += Math.max(labelLineHeight, labelLines.length * labelLineHeight) + spacing;
              pdf.setFontSize(valueFs);
              pdf.setFont('helvetica', 'normal');
              const valueLines = pdf.splitTextToSize(String(cell.value || ''), width - cellPadding * 2);
              pdf.text(valueLines, x + cellPadding, y);
              x += width + gap;
            }
            currentY += maxCellHeight + 4;
          }
        } else if (c.type === 'image') {
          const imgsFromPath = c.dataPath ? getByPath(gadgetData, c.dataPath) : undefined;
          const images: any[] = Array.isArray(imgsFromPath) ? imgsFromPath : (Array.isArray(c.data) ? c.data : []);
          const marginsSection = sectionCfg.margins || { left: 15, right: 195 };
          const availableW = (marginsSection.right || 195) - (marginsSection.left || 15);
          const imgSty = metadata.pdfStyling?.images || {};
          
          // CRITICAL FIX: Implement 2x3 grid (3 rows of 2 images each)
          const gridColumns = 2;
          const gridRows = 3; 
          const imagesPerPage = gridColumns * gridRows; // 6 images per page
          
          // Calculate image dimensions for grid layout
          const imageWidth = (availableW - 10) / gridColumns; // Subtract spacing between columns
          const imageHeight = 60; // Fixed height in mm for consistent sizing
          const rowSpacing = 5; // Space between rows
          const colSpacing = 5; // Space between columns
          
          // Image rendering quality controls
          const format = (imgSty.format || 'JPEG') as 'JPEG' | 'PNG';
          const quality = (typeof imgSty.quality === 'number' ? imgSty.quality : 0.92);
          const bg = imgSty.backgroundColor || [255, 255, 255];
          const fit: 'contain' | 'cover' | 'stretch' = (c as any).fit || imgSty.fit || 'cover';
          const mmToPx = (mm: number) => Math.max(1, Math.round((mm / 25.4) * 180));
          
          // Process images in chunks of 6 for grid layout
          for (let chunkStart = 0; chunkStart < images.length; chunkStart += imagesPerPage) {
            const chunk = images.slice(chunkStart, chunkStart + imagesPerPage);
            
            // Check if we need a new page for this chunk
            const totalGridHeight = gridRows * imageHeight + (gridRows - 1) * rowSpacing;
            if (currentY + totalGridHeight > contentBottomY) {
              pdf.addPage(); 
              addHeader(); 
              currentY = 30;
            }
            
            // Process all images in the chunk simultaneously using Promise.all
            const imagePromises = chunk.map(async (it, i) => {
              const row = Math.floor(i / gridColumns);
              const col = i % gridColumns;
              
              // Calculate position in grid
              const x = (marginsSection.left || 15) + col * (imageWidth + colSpacing);
              const y = currentY + row * (imageHeight + rowSpacing);
              
              try {
                const img = new Image();
                await new Promise<void>((resolve, reject) => {
                  img.onload = () => {
                    try {
                      const iw = img.naturalWidth || img.width;
                      const ih = img.naturalHeight || img.height;
                      const pxW = mmToPx(imageWidth);
                      const pxH = mmToPx(imageHeight);
                      
                      const canvas = document.createElement('canvas');
                      canvas.width = pxW; 
                      canvas.height = pxH;
                      const ctx = canvas.getContext('2d');
                      
                      if (ctx) {
                        // Fill background
                        ctx.fillStyle = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
                        ctx.fillRect(0, 0, pxW, pxH);
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // Calculate drawing dimensions for fit
                        let dw = pxW, dh = pxH, dx = 0, dy = 0;
                        if (fit === 'contain') {
                          const scale = Math.min(pxW / iw, pxH / ih);
                          dw = Math.round(iw * scale);
                          dh = Math.round(ih * scale);
                          dx = Math.floor((pxW - dw) / 2);
                          dy = Math.floor((pxH - dh) / 2);
                        } else if (fit === 'cover') {
                          const scale = Math.max(pxW / iw, pxH / ih);
                          dw = Math.round(iw * scale);
                          dh = Math.round(ih * scale);
                          dx = Math.floor((pxW - dw) / 2);
                          dy = Math.floor((pxH - dh) / 2);
                        }
                        
                        ctx.drawImage(img, dx, dy, dw, dh);
                      }
                      
                      const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
                      const dataUrl = canvas.toDataURL(mime, quality);
                      
                      // Add image to PDF at calculated grid position
                      pdf.addImage(dataUrl, format, x, y, imageWidth, imageHeight);
                      resolve();
                    } catch (canvasError) {
                      resolve();
                    }
                  };
                  
                  img.onerror = () => resolve();
                  
                  setTimeout(() => resolve(), 3000);
                  
                  img.src = String(it.url || it.src || '');
                });
              } catch (error) {
                // Image processing error, continue
              }
            });
            
            // Wait for all images in this chunk to complete
            try {
              const chunkTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
              await Promise.race([Promise.all(imagePromises), chunkTimeout]);
            } catch (error) {
              // Chunk processing error, continue
            }
            
            currentY += totalGridHeight + 10;
          }
        }
      }

      const total = pdf.getNumberOfPages();
      for (let i = 1; i <= total; i++) { 
        pdf.setPage(i); 
        addFooter(i, total); 
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };
    generate();
  }, [metadata, gadgetData]);

  return (
    <div id={id}>
      {previewUrl && (<iframe src={previewUrl} title="PDF Preview" style={{ width: '100%', height: '70vh', border: 'none' }} />)}
    </div>
  );
};

// Export sanitization utilities for use by other components
export { normalizeForPdf, sanitizeMarkdownForPdf };

export default PDFGeneratorWidget;
