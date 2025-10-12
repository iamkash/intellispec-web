/**
 * Registry Initializer - Initializes all widget and gadget registries
 */

import { GadgetRegistry } from './GadgetRegistry';
import { WidgetRegistry } from './WidgetRegistry';

// Widget imports
import { AreaChartGadget } from '../gadgets/chart/AreaChartGadget';
import { BarChartGadget } from '../gadgets/chart/BarChartGadget';
import { LineChartGadget } from '../gadgets/chart/LineChartGadget';
import { PieChartGadget } from '../gadgets/chart/PieChartGadget';
import { AreaChartComponent, BarChartComponent, LineChartComponent, PieChartComponent } from '../widgets/chart';
import ActionPanelWidget from '../widgets/display/ActionPanelWidget';
import { ActivityFeedWidget } from '../widgets/display/ActivityFeedWidget';
import { CardSelectorWidget } from '../widgets/display/CardSelectorWidget';
import { KPIWidget } from '../widgets/display/KPIWidget';
import { StatsCardComponent } from '../widgets/display/StatsCard';

// New visualization widget imports
import { ProgressRingComponent } from '../widgets/display/ProgressRingWidget';
import { ScoreGaugeComponent } from '../widgets/display/ScoreGaugeWidget';
import { StatCardComponent } from '../widgets/display/StatCardWidget';

// Gadget imports
import { BulkOperationsGadget, ReferenceDataManagementGadget, ReferenceListSelectorGadget, ReferenceOptionsGridGadget } from '../gadgets/admin';
import { ActionPanelGadget } from '../gadgets/dashboard/ActionPanelGadget';
import { DynamicCalculatorGadget } from '../gadgets/dashboard/DynamicCalculatorGadget';
import MegaMenuGadget from '../gadgets/dashboard/MegaMenuGadget';
import { StatsGadget } from '../gadgets/dashboard/StatsGadget';
import { ActivityFeedGadgetClass } from '../gadgets/display/ActivityFeedGadget';
import { CardSelectorGadget } from '../gadgets/display/CardSelectorGadget';
import InlineEditableGridGadget from '../gadgets/display/InlineEditableGridGadget';
import { KPIGadget } from '../gadgets/display/KPIGadget';
import SGridSearchGadget from '../gadgets/display/sgrid/SGridSearchGadget';
import AIAgenticWizardGadget from '../gadgets/forms/AIAgenticWizardGadget';
import AIAnalysisWizardGadget from '../gadgets/forms/AIAnalysisWizardGadget';
import DocumentFormGadget from '../gadgets/forms/DocumentFormGadget';

// Asset Management Gadgets
import { AssetDashboardGadget } from '../gadgets/dashboard/AssetDashboardGadget';
import { StatsGridGadget } from '../gadgets/dashboard/StatsGridGadget';
import { DataImportExportGadget } from '../gadgets/data-import-export-gadget';
import { ResourceTreeGadget } from '../gadgets/display/ResourceTreeGadget';
import { SplitPanelGadget } from '../gadgets/layout/SplitPanelGadget';

// Filter and KPI Gadgets
import GenericChartGadget from '../gadgets/charts/GenericChartGadget';
import GenericKPIGadget from '../gadgets/dashboard/GenericKPIGadget';
import WorkspaceFilterGadget from '../gadgets/input/WorkspaceFilterGadget';
import ObservationWidget from '../widgets/input/ObservationWidget';
import WorkspaceFilterWidget from '../widgets/input/WorkspaceFilterWidget';

// Input Widgets - Import all input widgets dynamically
import { AIAnalysisWidget } from '../widgets/input/AIAnalysisWidget';
import { AIChatbotWidget } from '../widgets/input/AIChatbotWidget';
import { AssetSelectorWidget } from '../widgets/input/AssetSelectorWidget';
import { AudioRecorderWidget } from '../widgets/input/AudioRecorderWidget';
import { AutoCompleteWidget } from '../widgets/input/AutoCompleteWidget';
import { ButtonGroupWidget } from '../widgets/input/ButtonGroupWidget';
import { CameraWidget } from '../widgets/input/CameraWidget';
import { CascaderWidget } from '../widgets/input/CascaderWidget';
import { CheckboxWidget } from '../widgets/input/CheckboxWidget';
import { ColorPickerWidget } from '../widgets/input/ColorPickerWidget';
import { ComboBoxWidget } from '../widgets/input/ComboBoxWidget';
import { DatePickerWidget } from '../widgets/input/DatePickerWidget';
import { DocumentUploadWidget } from '../widgets/input/DocumentUploadWidget';
import { DrawingWidget } from '../widgets/input/DrawingWidget';
import { EditableGridWidget } from '../widgets/input/EditableGridWidget';
import { FormSectionWidget } from '../widgets/input/FormSectionWidget';
import { FormStepWidget } from '../widgets/input/FormStepWidget';
import { FormTabsWidget } from '../widgets/input/FormTabsWidget';
import { ImageUploadWithDrawingWidget } from '../widgets/input/ImageUploadWithDrawingWidget';
import { InputFieldWidget } from '../widgets/input/InputFieldWidget';
import { InputNumberWidget } from '../widgets/input/InputNumberWidget';
import { InspectionFindingsWidget } from '../widgets/input/InspectionFindingsWidget';
import { LocationPickerWidget } from '../widgets/input/LocationPickerWidget';
import { MentionWidget } from '../widgets/input/MentionWidget';
import { OTPInputWidget } from '../widgets/input/OTPInputWidget';
import { PasswordWidget } from '../widgets/input/PasswordWidget';
import { PDFGeneratorWidget } from '../widgets/input/PDFGeneratorWidget';
import { PDFReportPreviewWidget } from '../widgets/input/PDFReportPreviewWidget';
import { QRCodeScannerWidget } from '../widgets/input/QRCodeScannerWidget';
import { RadioWidget } from '../widgets/input/RadioWidget';
import { RateWidget } from '../widgets/input/RateWidget';
import { RealtimeVoiceWidget } from '../widgets/input/RealtimeVoiceWidget';
import { SearchWidget } from '../widgets/input/SearchWidget';
import { SegmentedWidget } from '../widgets/input/SegmentedWidget';
import { SignatureWidget } from '../widgets/input/SignatureWidget';
import { SliderWidget } from '../widgets/input/SliderWidget';
import { SwitchWidget } from '../widgets/input/SwitchWidget';
import { TagsInputWidget } from '../widgets/input/TagsInputWidget';
import { TextAreaWidget } from '../widgets/input/TextAreaWidget';
import { TimePickerWidget } from '../widgets/input/TimePickerWidget';
import { TransferWidget } from '../widgets/input/TransferWidget';
import { TreeSelectWidget } from '../widgets/input/TreeSelectWidget';
import { UploadWidget } from '../widgets/input/UploadWidget';
import { VisionAnalysisWidget } from '../widgets/input/VisionAnalysisWidget';
import { VoiceRecorderWidget } from '../widgets/input/VoiceRecorderWidget';

// AI Gadgets
import AIStreamingAdvisorGadget from '../gadgets/ai/AIStreamingAdvisorGadget';
import GenericRAGChatbotGadget from '../gadgets/ai/GenericRAGChatbotGadget';

/**
 * Initialize all widget and gadget registries
 */
export function initializeRegistries(): void {
  // Initialize widget registry
  WidgetRegistry.register('stats-card', StatsCardComponent);
  WidgetRegistry.register('activity-feed', ActivityFeedWidget);
  WidgetRegistry.register('action-panel', ActionPanelWidget);
  WidgetRegistry.register('kpi', KPIWidget);
  WidgetRegistry.register('line-chart', LineChartComponent);
  WidgetRegistry.register('bar-chart', BarChartComponent);
  WidgetRegistry.register('area-chart', AreaChartComponent);
  WidgetRegistry.register('pie-chart', PieChartComponent);

  // Register new visualization widgets
  WidgetRegistry.register('progress-ring', ProgressRingComponent);
  WidgetRegistry.register('stat-card', StatCardComponent);
  WidgetRegistry.register('score-gauge', ScoreGaugeComponent);
  WidgetRegistry.register('card-selector-widget', CardSelectorWidget);
  
  // Register filter and input widgets
  WidgetRegistry.register('workspace-filter', WorkspaceFilterWidget);
  WidgetRegistry.register('observation-widget', ObservationWidget);

  // Register all input widgets dynamically
  WidgetRegistry.register('search', SearchWidget);
  WidgetRegistry.register('input-field', InputFieldWidget);
  WidgetRegistry.register('combo-box', ComboBoxWidget);
  WidgetRegistry.register('textarea', TextAreaWidget);
  WidgetRegistry.register('radio', RadioWidget);
  WidgetRegistry.register('checkbox', CheckboxWidget);
  WidgetRegistry.register('date-picker', DatePickerWidget);
  WidgetRegistry.register('date', DatePickerWidget); // Alias for date
  WidgetRegistry.register('time-picker', TimePickerWidget);
  WidgetRegistry.register('slider', SliderWidget);
  WidgetRegistry.register('switch', SwitchWidget);
  WidgetRegistry.register('upload', UploadWidget);
  WidgetRegistry.register('input-number', InputNumberWidget);
  WidgetRegistry.register('number', InputNumberWidget); // Alias for number
  WidgetRegistry.register('select', ComboBoxWidget); // Use ComboBox as select
  WidgetRegistry.register('multiselect', CheckboxWidget); // Use Checkbox for multiselect
  WidgetRegistry.register('dynamic-observations', ObservationWidget); // Alias for observations
  WidgetRegistry.register('autocomplete', AutoCompleteWidget);
  WidgetRegistry.register('tags-input', TagsInputWidget);
  WidgetRegistry.register('cascader', CascaderWidget);
  WidgetRegistry.register('color-picker', ColorPickerWidget);
  WidgetRegistry.register('mention', MentionWidget);
  WidgetRegistry.register('transfer', TransferWidget);
  WidgetRegistry.register('tree-select', TreeSelectWidget);
  WidgetRegistry.register('segmented', SegmentedWidget);
  WidgetRegistry.register('password', PasswordWidget);
  WidgetRegistry.register('otp-input', OTPInputWidget);
  WidgetRegistry.register('location-picker', LocationPickerWidget);
  WidgetRegistry.register('signature', SignatureWidget);
  WidgetRegistry.register('drawing', DrawingWidget);
  WidgetRegistry.register('camera', CameraWidget);
  WidgetRegistry.register('audio-recorder', AudioRecorderWidget);
  WidgetRegistry.register('qr-scanner', QRCodeScannerWidget);
  WidgetRegistry.register('button-group', ButtonGroupWidget);
  WidgetRegistry.register('asset-selector', AssetSelectorWidget);
  WidgetRegistry.register('form-section', FormSectionWidget);
  WidgetRegistry.register('ai-chatbot', AIChatbotWidget);
  WidgetRegistry.register('inspection-findings', InspectionFindingsWidget);
  WidgetRegistry.register('document-upload', DocumentUploadWidget);
  WidgetRegistry.register('pdf-preview', PDFReportPreviewWidget);
  WidgetRegistry.register('voice-recorder', VoiceRecorderWidget);
  WidgetRegistry.register('realtime-voice-widget', RealtimeVoiceWidget);
WidgetRegistry.register('voice-recorder-widget', VoiceRecorderWidget);
WidgetRegistry.register('image-upload-drawing', ImageUploadWithDrawingWidget);
  // Alias with full name used in calculators
  WidgetRegistry.register('image-upload-with-drawing', ImageUploadWithDrawingWidget);
  WidgetRegistry.register('vision-analysis', VisionAnalysisWidget);
  WidgetRegistry.register('ai-analysis', AIAnalysisWidget);
  WidgetRegistry.register('pdf-generator', PDFGeneratorWidget);
  WidgetRegistry.register('editable-grid', EditableGridWidget);
  WidgetRegistry.register('form-step', FormStepWidget);
  WidgetRegistry.register('form-tabs', FormTabsWidget);
  WidgetRegistry.register('rate', RateWidget);

  // Initialize gadget registry (using workspace-compatible naming)
  GadgetRegistry.register('stats-gadget', StatsGadget);
  GadgetRegistry.register('activity-feed-gadget', ActivityFeedGadgetClass);
  GadgetRegistry.register('action-panel-gadget', ActionPanelGadget);
  GadgetRegistry.register('dynamic-calculator-gadget', DynamicCalculatorGadget);
  GadgetRegistry.register('mega-menu-gadget', MegaMenuGadget);
  GadgetRegistry.register('kpi-gadget', KPIGadget);
  GadgetRegistry.register('card-selector-gadget', CardSelectorGadget);
  GadgetRegistry.register('sgrid-search-gadget', SGridSearchGadget);
  GadgetRegistry.register('inline-editable-grid-gadget', InlineEditableGridGadget);
  GadgetRegistry.register('line-chart-gadget', LineChartGadget);
  GadgetRegistry.register('area-chart-gadget', AreaChartGadget);
  GadgetRegistry.register('pie-chart-gadget', PieChartGadget);
  GadgetRegistry.register('bar-chart-gadget', BarChartGadget);
  GadgetRegistry.register('document-form-gadget', DocumentFormGadget);
  GadgetRegistry.register('ai-analysis-wizard-gadget', AIAnalysisWizardGadget);
  GadgetRegistry.register('ai-agentic-wizard-gadget', AIAgenticWizardGadget);
// Reference Data Management Gadgets
  GadgetRegistry.register('reference-list-selector-gadget', ReferenceListSelectorGadget);
  GadgetRegistry.register('reference-options-grid-gadget', ReferenceOptionsGridGadget);
  GadgetRegistry.register('reference-data-management-gadget', ReferenceDataManagementGadget);
  GadgetRegistry.register('bulk-operations-gadget', BulkOperationsGadget);
  
  // Asset Management Gadgets
  GadgetRegistry.register('resource-tree-gadget', ResourceTreeGadget);
  GadgetRegistry.register('stats-grid-gadget', StatsGridGadget);
  GadgetRegistry.register('asset-dashboard-gadget', AssetDashboardGadget);
  GadgetRegistry.register('split-panel-gadget', SplitPanelGadget);
  GadgetRegistry.register('data-import-export-gadget', DataImportExportGadget);
  
  // Filter and KPI Gadgets
  GadgetRegistry.register('workspace-filter-gadget', WorkspaceFilterGadget);
  GadgetRegistry.register('generic-kpi-gadget', GenericKPIGadget);
  GadgetRegistry.register('generic-chart-gadget', GenericChartGadget);
  
  // AI Gadgets
  GadgetRegistry.register('rag-chatbot-gadget', GenericRAGChatbotGadget);
  GadgetRegistry.register('ai-streaming-advisor-gadget', AIStreamingAdvisorGadget);
}

/**
 * Clear all registries (useful for testing or hot reload)
 */
export function clearRegistries() {
  WidgetRegistry.clear();
  GadgetRegistry.clear();
}

/**
 * Get the current state of registries (useful for debugging)
 */
export function getRegistryStatus() {
  return {
    widgets: WidgetRegistry.list(),
    gadgets: GadgetRegistry.list()
  };
} 