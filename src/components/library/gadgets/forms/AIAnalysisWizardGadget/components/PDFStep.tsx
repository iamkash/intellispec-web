import { Card, Spin } from 'antd';
import React from 'react';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';
import { safePdfValue } from '../utils/pdfValueExtractor';
import { BaseGadget } from '../../../base';

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
  const pdfStyling = (config.steps.pdf.reportConfig as any)?.pdfStyling;
  const optionsCacheRef = React.useRef<Map<string, Promise<Array<{ label: string; value: any }>>>>(new Map());
  const [pdfMetadataState, setPdfMetadataState] = React.useState<any | null>(null);
  const [gadgetDataState, setGadgetDataState] = React.useState<any | null>(null);
  const [loadingMetadata, setLoadingMetadata] = React.useState<boolean>(false);

  const normalizeOptions = React.useCallback((items: any[], field: any): Array<{ label: string; value: any }> => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => {
        if (item === null || item === undefined) {
          return null;
        }

        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return { label: String(item), value: item };
        }

        if (typeof item === 'object') {
          const labelCandidate =
            (field?.labelField && item[field.labelField]) ??
            item.label ??
            item.name ??
            item.title ??
            item.display ??
            item.text ??
            item.value ??
            item.id ??
            item.code ??
            item.slug;

          const valueCandidate =
            (field?.valueField && item[field.valueField]) ??
            item.value ??
            item.id ??
            item._id ??
            item.key ??
            item.code ??
            item.slug ??
            labelCandidate ??
            item;

          return {
            label: labelCandidate !== undefined ? String(labelCandidate) : String(valueCandidate ?? ''),
            value: valueCandidate
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{ label: string; value: any }>;
  }, []);

  const buildKeyVariants = React.useCallback((key: string): string[] => {
    if (!key) return [];
    const variants = new Set<string>();
    variants.add(key);

    // snake_case -> camelCase / PascalCase
    const camel = key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
    variants.add(camel);
    variants.add(camel.charAt(0).toUpperCase() + camel.slice(1));

    // camelCase -> snake_case
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    variants.add(snake);

    // Remove suffixes
    if (key.endsWith('_id')) {
      variants.add(key.slice(0, -3));
    }
    if (key.endsWith('Id')) {
      variants.add(`${key.slice(0, -2)}_id`);
    }

    return Array.from(variants);
  }, []);

  const getContextValue = React.useCallback((key: string, sources: Record<string, any>[]): any => {
    const candidates = buildKeyVariants(key);
    for (const source of sources) {
      if (!source || typeof source !== 'object') continue;
      for (const candidate of candidates) {
        if (Object.prototype.hasOwnProperty.call(source, candidate)) {
          const value = source[candidate];
          if (value !== undefined) {
            return value;
          }
        }
      }
    }
    return undefined;
  }, [buildKeyVariants]);

  const computeOptionsUrl = React.useCallback(
    (field: any, sources: Record<string, any>[]) => {
      const rawUrl =
        field?.optionsUrl ||
        field?.props?.optionsUrl ||
        field?.meta?.optionsUrl;

      if (!rawUrl || typeof rawUrl !== 'string') {
        return null;
      }

      let url = rawUrl;

      if (field.dependsOn) {
        const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
        const params = new URLSearchParams();

        dependencies.forEach((depId: string) => {
          const depValue = getContextValue(depId, sources);
          if (depValue === undefined || depValue === null || depValue === '') {
            return;
          }

          const appendValue = (value: any) => {
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
              value.forEach(appendValue);
              return;
            }
            if (typeof value === 'object') {
              const extracted =
                value.value ??
                value.id ??
                value._id ??
                value.key ??
                value.code ??
                value.slug;
              if (extracted !== undefined && extracted !== null) {
                params.append(depId, String(extracted));
              }
              return;
            }
            params.append(depId, String(value));
          };

          appendValue(depValue);
        });

        const queryString = params.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }

      return url;
    },
    [getContextValue]
  );

  const fetchOptionsForField = React.useCallback(
    async (field: any, sources: Record<string, any>[]): Promise<Array<{ label: string; value: any }>> => {
      if (!field) return [];

      const inlineOptions =
        field.options ||
        field.props?.options ||
        field.meta?.options;

      if (Array.isArray(inlineOptions) && inlineOptions.length > 0) {
        return normalizeOptions(inlineOptions, field);
      }

      const url = computeOptionsUrl(field, sources);
      if (!url) {
        return [];
      }

      const cacheKey = `${field.id || field.name || ''}|${url}`;
      let pending = optionsCacheRef.current.get(cacheKey);
      if (!pending) {
        pending = (async () => {
          try {
            const response = await BaseGadget.makeAuthenticatedFetch(url);
            const data = await response.json().catch(() => null);

            if (!data) return [];
            if (Array.isArray(data)) {
              return normalizeOptions(data, field);
            }
            if (Array.isArray(data.options)) {
              return normalizeOptions(data.options, field);
            }
            if (Array.isArray(data.data)) {
              return normalizeOptions(data.data, field);
            }
            return [];
          } catch (error) {
            console.error(`[PDFStep] Failed to load options for field ${field?.id || '(unknown)'}`, error);
            return [];
          }
        })();
        optionsCacheRef.current.set(cacheKey, pending);
      }

      return pending;
    },
    [computeOptionsUrl, normalizeOptions]
  );

  const resolveFieldDisplayValue = React.useCallback(
    async (field: any, rawValue: any, contextSources: Record<string, any>[]): Promise<string> => {
      if (!field) {
        return safePdfValue(rawValue, undefined);
      }

      const resolvedOptions = await fetchOptionsForField(field, contextSources);
      let fieldConfig = field;

      if (resolvedOptions.length > 0) {
        fieldConfig = {
          ...field,
          options: resolvedOptions,
          props: field?.props ? { ...field.props, options: resolvedOptions } : { options: resolvedOptions }
        };
      }

      return safePdfValue(rawValue, fieldConfig?.type || field.type, fieldConfig);
    },
    [fetchOptionsForField]
  );

  React.useEffect(() => {
    let cancelled = false;

    const buildMetadata = async () => {
      setLoadingMetadata(true);

      try {
        const contentSections: any[] = [];
        let order = 1;

        const sectionList = Array.isArray(sections) ? sections : [];

        for (let index = 0; index < sectionList.length; index += 1) {
          const s = sectionList[index];
          if (!s) continue;

          const isVoice = (s as any).sectionType === 'voice';
          const isImage = (s as any).sectionType === 'image';
          const isVision = Boolean((s as any).imageAnalysisPrompt);

          if (isVoice || isImage) {
            continue;
          }

          if (isVision && (s as any).includeInPdf === true) {
            const pdfCfg = (s as any).pdf || {};
            const includeOverview = pdfCfg.includeOverview !== false;
            const includeImages = pdfCfg.includeImages === true;

            if (includeOverview) {
              const ov = String(((wizardData.sections || [])[index] as any)?.imageAnalysis?.overview || '');
              if (ov) {
                try {
                  const tableRegex = /(^|\n)\|[^\n]+\|\n\|[-:|\s]+\|[\s\S]*?(?=\n\n|$)/g;
                  const matches = ov.match(tableRegex) || [];
                  for (let tIdx = 0; tIdx < matches.length; tIdx += 1) {
                    const block = matches[tIdx];
                    try {
                      const lines = block.trim().split('\n').map(l => l.trim());
                      const headerCells = (lines[0] || '').split('|').map(s => s.trim()).filter(Boolean);
                      const rows = lines
                        .slice(2)
                        .map(line => line.split('|').map(s => s.trim()).filter(Boolean))
                        .filter(r => r.length === headerCells.length);
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
                    } catch {
                      // ignore malformed table
                    }
                  }
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
              const imagesDataPath = (pdfCfg as any).imagesDataPath as string | undefined;
              let imgs: any[] = [];

              if (imagesDataPath) {
                try {
                  const match = imagesDataPath.match(/^sections\[(.*?)\]\.images$/);
                  if (match) {
                    const secId = match[1];
                    const secIdx = sectionList.findIndex(ss => (ss as any)?.id === secId);
                    if (secIdx >= 0) {
                      const images = ((wizardData.sections || [])[secIdx] as any)?.images;
                      if (Array.isArray(images)) {
                        imgs = images;
                      }
                    }
                  }
                } catch {
                  // ignore
                }
              }

              if (imgs.length === 0) {
                const byIndex = ((wizardData.sections || [])[index] as any)?.images;
                if (Array.isArray(byIndex)) {
                  imgs = byIndex;
                }
              }

              if (imgs.length === 0 && wizardData.imageData && wizardData.imageData.length > 0) {
                imgs = wizardData.imageData;
              }

              const mapped = (imgs || []).map((it: any) => ({
                url: it.url,
                name: it.name,
                drawingData: it.drawingData
              }));

              const imagesPerPage = 6;
              for (let i = 0; i < mapped.length; i += imagesPerPage) {
                const chunk = mapped.slice(i, i + imagesPerPage);
                const pageTitle = mapped.length > imagesPerPage
                  ? `${s.title || 'Images'} (Page ${Math.floor(i / imagesPerPage) + 1} of ${Math.ceil(mapped.length / imagesPerPage)})`
                  : (s.title || 'Images');

                contentSections.push({
                  id: String(s.id) + `:images-page-${Math.floor(i / imagesPerPage)}`,
                  title: pageTitle,
                  includeInPdf: true,
                  order: order++,
                  content: {
                    type: 'image',
                    data: chunk,
                    width: 80,
                    height: 40,
                    fit: 'cover',
                    align: 'center',
                    widthPercent: 0.4,
                    heightPx: 80
                  }
                });
              }
            }

            continue;
          }

          const secData = ((wizardData.sections || [])[index] as any) || {};
          const title = s.title || s.id;
          const sectionFormData = secData.formData || {};
          const globalFormData = (wizardData as any)?.globalFormData || {};
          const combinedFormData = { ...globalFormData, ...sectionFormData };
          const contextSources = [
            combinedFormData,
            wizardData.documentSummary || {},
            wizardData.globalFormData || {},
            wizardData.recordContext || {}
          ];

          if ((s as any).grid) {
            const gridCfg = (s as any).grid as any;
            const existingRows = Array.isArray(combinedFormData[gridCfg.dataKey]) ? combinedFormData[gridCfg.dataKey] : [];

            const deriveRowsFromAnalysis = (): any[] => {
              try {
                const srcId = (s as any).resourcesFromSectionId || gridCfg.sourceSectionId || 'image_analysis';
                const srcIdx = sectionList.findIndex(ss => (ss as any)?.id === srcId);
                if (srcIdx < 0) return [];
                const src = ((wizardData.sections || [])[srcIdx] || {}) as any;
                const recs = Array.isArray(src?.imageAnalysis?.suggestions) ? src.imageAnalysis.suggestions : [];
                const ids = Array.isArray(src?.imageAnalysis?.selectedSuggestionIds) ? src.imageAnalysis.selectedSuggestionIds : [];
                const picked = ids.length > 0
                  ? ids.map((id: string) => recs.find((r: any) => String(r.id) === String(id))).filter(Boolean)
                  : recs;
                return picked.flatMap((r: any, i: number) => (Array.isArray(r.resources) ? r.resources : []).map((res: any, j: number) => ({
                  id: String(res.id || `${i}-${j}`),
                  name: String(res.name || ''),
                  type: res.type ? String(res.type) : '',
                  quantity: res.quantity ?? '',
                  notes: res.notes ? String(res.notes) : ''
                })));
              } catch {
                return [];
              }
            };

            const rows = existingRows.length > 0 ? existingRows : deriveRowsFromAnalysis();
            const columns = (gridCfg.columns || []).map((c: any) => ({ header: c.title || c.key, key: c.key }));

            if (rows.length > 0) {
              contentSections.push({
                id: String(s.id),
                title,
                includeInPdf: true,
                order: order++,
                content: { type: 'table', columns, data: rows }
              });
            }
            continue;
          }

          if ((s as any).form?.groups && (s as any).form.groups.length > 0) {
            const pdfLayout = (s as any).pdfLayout;
            const allFields: any[] = [];
            (s as any).form.groups.forEach((g: any) => {
                (g.fields || []).forEach((f: any) => allFields.push(f));
              });

          if (pdfLayout && String(pdfLayout.type) === 'grid') {
            const columnsCount = Math.max(1, Number(pdfLayout.columns || 4));
            const items: Array<{ label: string; value: string; signatureData?: any }> = [];

            for (const field of allFields) {
              const raw = combinedFormData[field.id];
              const val = await resolveFieldDisplayValue(field, raw, contextSources);
              const hasSignature =
                field?.type === 'signature' &&
                raw &&
                typeof raw === 'object' &&
                raw.dataURL;
              const trimmedValue = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
              if (!hasSignature && trimmedValue.length === 0) {
                continue;
              }

              const itemEntry: any = {
                label: String(field.label || field.id),
                value: val
              };
              if (hasSignature) {
                itemEntry.signatureData = raw;
              }
              items.push(itemEntry);
            }

            if (items.length === 0) {
              continue;
            }

            contentSections.push({
              id: String(s.id),
              title,
              hideHeader: (s as any).hideHeaderInPdf === true,
              includeInPdf: true,
              order: order++,
              content: { type: 'labelTopGrid', columnsCount, items, labelValueSpacing: 2, gap: 4, cellPadding: 2 }
            });
          } else if (!pdfLayout || String(pdfLayout.type || '') === '') {
            const rows: Array<Array<{ label: string; value: string; span: number; signatureData?: any }>> = [];
            let currentRow: Array<{ label: string; value: string; span: number; signatureData?: any }> = [];
            let used = 0;
            const pushRow = () => {
              if (currentRow.length === 0) {
                used = 0;
                return;
              }
              rows.push(currentRow);
              currentRow = [];
              used = 0;
            };

            for (const field of allFields) {
              const span = Math.min(24, Math.max(1, Number((field as any).lgSpan ?? ((field as any).type === 'textarea' ? 24 : 12))));
              const raw = combinedFormData[field.id];
              const val = await resolveFieldDisplayValue(field, raw, contextSources);
              const hasSignature =
                field?.type === 'signature' &&
                raw &&
                typeof raw === 'object' &&
                raw.dataURL;
              const trimmedValue = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
              if (!hasSignature && trimmedValue.length === 0) {
                continue;
              }

              const cell: any = { label: String(field.label || field.id), value: val, span };
              if (hasSignature) {
                cell.signatureData = raw;
              }
              if (used + span > 24) {
                pushRow();
              }
              currentRow.push(cell);
              used += span;
              if (used === 24) {
                pushRow();
              }
            }
            pushRow();

            if (rows.length === 0) {
              continue;
            }

            contentSections.push({
              id: String(s.id),
              title,
              hideHeader: (s as any).hideHeaderInPdf === true,
              includeInPdf: true,
              order: order++,
              content: { type: 'formGrid', rows }
            });
          } else {
            const lines: string[] = [];
            for (const field of allFields) {
              const raw = combinedFormData[field.id];
              const val = await resolveFieldDisplayValue(field, raw, contextSources);
              const hasSignature =
                field?.type === 'signature' &&
                raw &&
                typeof raw === 'object' &&
                raw.dataURL;
              const trimmedValue = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
              if (!hasSignature && trimmedValue.length === 0) {
                continue;
              }
              lines.push(`${field.label || field.id}: ${val}`);
            }
            if (lines.length === 0) {
              continue;
            }
            const template = lines.join('\\n');
            contentSections.push({
              id: String(s.id),
              title,
              includeInPdf: true,
              order: order++,
              content: { type: 'text', template }
            });
          }

          continue;
        }

          // Default section handling (non-form)
          const secContent = (secData as any)?.textData || '';
          if (secContent) {
            contentSections.push({
              id: String(s.id),
              title,
              includeInPdf: true,
              order: order++,
              content: { type: 'text', template: secContent }
            });
          }
        }

        const companyName = (pdfStyling as any)?.header?.companyName || 'intelliSPEC';
        const companyAddress = (pdfStyling as any)?.header?.companyAddress || '';

        const pdfMetadata = {
          header: {
            title: String(config.steps.pdf.title || config.title || 'Report'),
            companyName,
            companyAddress
          },
          pdfStyling,
          sections: contentSections
        };

        const valueForPdf = {
          reportTitle: String(config.steps.pdf.title || config.title || 'Report'),
          location: '',
          inspectorName: '',
          inspectorId: '',
          inspectionDate: '',
          inspectionTime: '',
          template: 'standard'
        };

        if (!cancelled) {
          setPdfMetadataState(pdfMetadata);
          setGadgetDataState(valueForPdf);
        }
      } catch (error) {
        console.error('[PDFStep] Failed to prepare PDF metadata', error);
        if (!cancelled) {
          setPdfMetadataState(null);
          setGadgetDataState(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingMetadata(false);
        }
      }
    };

    buildMetadata();

    return () => {
      cancelled = true;
    };
  }, [config, sections, wizardData, pdfStyling, resolveFieldDisplayValue]);

  const metadataReady = pdfMetadataState && gadgetDataState;
  const isLoading = loadingMetadata || !metadataReady;

  return (
    <Card className="glass-card wizard-card pdf-step" title={<span>{config.steps.pdf.title}</span>}>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Spin tip="Preparing PDF export..." />
        </div>
      ) : (
        <React.Suspense fallback={null}>
          <PDFGeneratorWidget
            id={config.steps.pdf.id || 'pdf-generator'}
            metadata={pdfMetadataState}
            gadgetData={gadgetDataState}
          />
        </React.Suspense>
      )}
    </Card>
  );
};
