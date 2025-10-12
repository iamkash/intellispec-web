/**
 * ImageSectionClean - Clean implementation of image section using GridFS
 * 
 * This component:
 * 1. Uses ImageUploadWithGridFS for immediate GridFS uploads
 * 2. Never stores base64 data
 * 3. Provides clean state management
 */

import { Card } from 'antd';
import React, { useCallback } from 'react';
import { GridFSImageWithDrawing, ImageUploadWithDrawingGridFS } from '../../../../widgets/input/ImageUploadWithDrawingGridFS';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

interface ImageSectionProps {
    section: any;
    sectionIndex: number;
    wizardData: AIAnalysisWizardData;
    updateSectionData: (sectionIndex: number, update: any) => void;
    config: AIAnalysisWizardConfig;
}

export const ImageSectionClean: React.FC<ImageSectionProps> = ({
    section,
    sectionIndex,
    wizardData,
    updateSectionData,
    config
}) => {
    // Get current images from wizard data (GridFS references only)
    const currentImages = (wizardData.sections?.[sectionIndex] as any)?.images || [];

    // Handle image changes - only GridFS references
    const handleImageChange = useCallback((images: GridFSImageWithDrawing[]) => {
        console.log('[ImageSectionClean] Images updated:', {
            count: images.length,
            images: images.map(img => ({
                name: img.name,
                gridfsId: img.gridfsId,
                type: img.type,
                url: img.url
            }))
        });

        // Update wizard data with GridFS references only
        updateSectionData(sectionIndex, { 
            images: images.map(img => ({
                uid: img.uid,
                name: img.name,
                url: img.url,
                gridfsId: img.gridfsId,
                type: 'gridfs',
                metadata: img.metadata,
                drawingData: img.drawingData, // Include drawing annotations if any
                description: img.description
            }))
        });
    }, [sectionIndex, updateSectionData]);

    // Don't render if not an image section
    if ((section as any)?.sectionType !== 'image') {
        return null;
    }

    return (
        <Card 
            className="glass-subcard" 
            size="small" 
            title={<span>Equipment Images</span>} 
            headStyle={{ padding: '6px 10px' }} 
            bodyStyle={{ padding: 8 }}
        >
            <ImageUploadWithDrawingGridFS
                value={currentImages}
                onChange={handleImageChange}
                maxCount={section.images?.maxCount ?? config.steps.input?.images?.maxCount ?? 10}
                maxSize={section.images?.maxSize ?? config.steps.input?.images?.maxSize ?? 10}
                accept={section.images?.accept ?? 'image/*'}
                multiple={section.images?.multiple !== false}
                drawingEnabled={section.images?.drawingEnabled ?? config.steps.input?.images?.drawingEnabled ?? true}
                drawingTools={section.images?.drawingTools ?? config.steps.input?.images?.drawingTools}
                showPreview={true}
                showThumbnails={true}
                layout="grid"
            />
        </Card>
    );
};

export default ImageSectionClean;
