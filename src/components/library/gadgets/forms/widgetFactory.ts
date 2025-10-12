import React from 'react';
import { FieldConfig } from './types';

// Import all available input widgets
import {
  AssetSelectorWidget,
  AudioRecorderWidget,
  AutoCompleteWidget,
  ButtonGroupWidget,
  CameraWidget,
  CascaderWidget,
  CheckboxWidget,
  ColorPickerWidget,
  ComboBoxWidget,
  DatePickerWidget,
  DocumentUploadWidget,
  DrawingWidget,
  EditableGridWidget,
  ImageUploadWithDrawingWidget,
  InputFieldWidget,
  InputNumberWidget,
  InspectionFindingsWidget,
  LocationPickerWidget,
  MentionWidget,
  OTPInputWidget,
  PasswordWidget,
  PDFReportPreviewWidget,
  QRCodeScannerWidget,
  RadioWidget,
  RateWidget,
  SegmentedWidget,
  SignatureWidget,
  SliderWidget,
  SwitchWidget,
  TagsInputWidget,
  TextAreaWidget,
  TimePickerWidget,
  TransferWidget,
  TreeSelectWidget,
  UploadWidget
} from '../../widgets/input';

// Import visualization widgets
import { ProgressRingComponent } from '../../widgets/display/ProgressRingWidget';
import { ScoreGaugeComponent } from '../../widgets/display/ScoreGaugeWidget';
import { StatCardComponent } from '../../widgets/display/StatCardWidget';

// Import display gadgets for embedded use
import InlineEditableGrid from '../display/InlineEditableGrid';

// Widget Factory - Maps field types to widget components
export const createWidgetFactory = (gadget: any) => ({
  // Input widgets with underlined variant
  text: (props: any) => React.createElement(InputFieldWidget, props),
  email: (props: any) => React.createElement(InputFieldWidget, props),
  phone: (props: any) => React.createElement(InputFieldWidget, props),
  url: (props: any) => React.createElement(InputFieldWidget, props),
  textarea: (props: any) => React.createElement(TextAreaWidget, props),
  number: (props: any) => React.createElement(InputNumberWidget, props),
  password: (props: any) => React.createElement(PasswordWidget, { ...props, id: props.fieldPath }),
  date: (props: any) => React.createElement(DatePickerWidget, props),
  time: (props: any) => React.createElement(TimePickerWidget, props),
  select: (props: any) => React.createElement(ComboBoxWidget, { ...props, options: props.options || [] }),
  multiselect: (props: any) => React.createElement(ComboBoxWidget, { ...props, options: props.options || [] }),
  // Also support component-name aliases for metadata compatibility
  InputFieldWidget: (props: any) => React.createElement(InputFieldWidget, props),
  TextAreaWidget: (props: any) => React.createElement(TextAreaWidget, props),
  InputNumberWidget: (props: any) => React.createElement(InputNumberWidget, props),
  DatePickerWidget: (props: any) => React.createElement(DatePickerWidget, props),
  TimePickerWidget: (props: any) => React.createElement(TimePickerWidget, props),
  ComboBoxWidget: (props: any) => React.createElement(ComboBoxWidget, { ...props, options: props.options || [] }),
  AutoCompleteWidget: (props: any) => React.createElement(AutoCompleteWidget, { ...props, options: props.options || [] }),
  CascaderWidget: (props: any) => React.createElement(CascaderWidget, { ...props, options: props.options || [] }),
  TreeSelectWidget: (props: any) => React.createElement(TreeSelectWidget, { ...props, id: props.fieldPath, treeData: gadget.transformOptionsToTreeData(props.options || []) }),
  MentionWidget: (props: any) => React.createElement(MentionWidget, props),
  SwitchWidget: (props: any) => React.createElement(SwitchWidget, { ...props, size: props.size === 'middle' ? 'default' : props.size }),
  RadioWidget: (props: any) => React.createElement(RadioWidget, { ...props, options: props.options || [], direction: props.direction || 'horizontal', buttonStyle: props.buttonStyle || 'solid' }),
  CheckboxWidget: (props: any) => React.createElement(CheckboxWidget, { ...props, options: props.options || [] }),
  SegmentedWidget: (props: any) => React.createElement(SegmentedWidget, { ...props, id: props.fieldPath, options: props.options || [] }),
  TagsInputWidget: (props: any) => React.createElement(TagsInputWidget, props),
  tags: (props: any) => React.createElement(TagsInputWidget, props),
  'tags-input': (props: any) => React.createElement(TagsInputWidget, props),
  autocomplete: (props: any) => React.createElement(AutoCompleteWidget, { ...props, options: props.options || [] }),
  cascader: (props: any) => React.createElement(CascaderWidget, { ...props, options: props.options || [] }),
  treeselect: (props: any) => React.createElement(TreeSelectWidget, { ...props, id: props.fieldPath, treeData: gadget.transformOptionsToTreeData(props.options || []) }),
  mention: (props: any) => React.createElement(MentionWidget, props),
  
  // Input widgets with standard variant
  slider: (props: any) => React.createElement(SliderWidget, props),
  switch: (props: any) => React.createElement(SwitchWidget, { ...props, size: props.size === 'middle' ? 'default' : props.size }),
  radio: (props: any) => React.createElement(RadioWidget, { 
    ...props, 
    options: props.options || [],
    direction: props.direction || 'horizontal',
    buttonStyle: props.buttonStyle || 'solid'
  }),
  checkbox: (props: any) => React.createElement(CheckboxWidget, { ...props, options: props.options || [] }),
  checkbox_group: (props: any) => React.createElement(CheckboxWidget, { ...props, options: props.options || [] }),
  'asset-selector': (props: any) => React.createElement(AssetSelectorWidget, props),
  rate: (props: any) => React.createElement(RateWidget, props),
  color: (props: any) => React.createElement(ColorPickerWidget, props),
  segmented: (props: any) => React.createElement(SegmentedWidget, { ...props, id: props.fieldPath, options: props.options || [] }),
  upload: (props: any) => React.createElement(UploadWidget, props),
  'file-upload': (props: any) => React.createElement(UploadWidget, props),
  'image-upload-with-drawing': (props: any) => React.createElement(ImageUploadWithDrawingWidget as any, { ...props, id: props.fieldPath }),
  'image-upload-drawing': (props: any) => React.createElement(ImageUploadWithDrawingWidget as any, { ...props, id: props.fieldPath }),
  transfer: (props: any) => React.createElement(TransferWidget, { ...props, dataSource: gadget.transformOptionsToTransferData(props.options || []) }),
  otp: (props: any) => React.createElement(OTPInputWidget, { ...props, id: props.fieldPath }),
  location: (props: any) => React.createElement(LocationPickerWidget, { ...props, id: props.fieldPath }),
  signature: (props: any) => React.createElement(SignatureWidget, { ...props, id: props.fieldPath }),
  drawing: (props: any) => React.createElement(DrawingWidget, { ...props, id: props.fieldPath }),
  camera: (props: any) => React.createElement(CameraWidget, { ...props, id: props.fieldPath }),
  audio: (props: any) => React.createElement(AudioRecorderWidget, { ...props, id: props.fieldPath }),
  qr: (props: any) => React.createElement(QRCodeScannerWidget, { ...props, id: props.fieldPath }),
  buttongroup: (props: any) => React.createElement(ButtonGroupWidget, { ...props, id: props.fieldPath, options: props.options || [] }),
  'button-group': (props: any) => React.createElement(ButtonGroupWidget, { ...props, id: props.fieldPath, options: props.options || [] }),
  'inspection-findings': (props: any) => React.createElement(InspectionFindingsWidget, { ...props, id: props.fieldPath }),
  'document-upload': (props: any) => React.createElement(DocumentUploadWidget, { ...props, id: props.fieldPath }),
  'pdf-report-preview': (props: any) => React.createElement(PDFReportPreviewWidget, { 
    ...props, 
    id: props.fieldPath,
    formData: props.formData || {} // Pass form data to the widget
  }),
  
  // Display widgets
  'stat-card': (props: any) => React.createElement(StatCardComponent, { value: props.value, ...props.widgetProps }),
  'progress-ring': (props: any) => React.createElement(ProgressRingComponent, { value: props.value, ...props.widgetProps }),
  'score-gauge': (props: any) => React.createElement(ScoreGaugeComponent, { value: props.value, ...props.widgetProps }),
  
  // Embedded gadgets
  'inline-editable-grid': (props: any) => {
    const gridProps = {
      ...props.widgetProps,
      initialData: props.value || [],
      onDataChange: props.onChange, // Pass the onChange directly to avoid creating new functions
      config: {
        ...props.widgetProps?.config,
        embeddedMode: true, // Always operate in embedded mode when used as a form widget
        parentField: props.fieldPath // Pass the field path for reference
      }
    };
    return React.createElement(InlineEditableGrid, gridProps);
  },
  
  // EditableGridWidget for simple table editing
  'editable-grid': (props: any) => {
    // Extract urlParams from formData or URL for dynamic option fetching
    const urlParams: Record<string, string> = {};
    
    // Try to get tenant/document ID from formData
    if (props.formData?.id) {
      urlParams.id = props.formData.id;
      urlParams.tenantId = props.formData.id; // Assume id is tenantId for tenant forms
    }
    
    // Try to get from URL query params if not in formData
    if (!urlParams.id) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlSearchParams.get('id');
      if (idFromUrl) {
        urlParams.id = idFromUrl;
        urlParams.tenantId = idFromUrl;
      }
    }
    
    const gridProps = {
      rows: props.value || [],
      onChange: props.onChange,
      columnsMeta: props.widgetProps?.columnsMeta || [],
      features: props.widgetProps?.features || {
        enableSorting: true,
        enableFiltering: true,
        enablePagination: true,
        enableSelection: true,
        pageSizeOptions: [5, 10, 20],
        readOnly: false,
        bordered: true
      },
      className: props.className,
      urlParams // Pass URL parameters for dynamic option fetching
    };
    return React.createElement(EditableGridWidget, gridProps);
  },
});

/**
 * Get props for widget based on type
 */
export const getPropsForWidget = (widgetType: string, baseProps: any, underlinedProps: any, standardProps: any) => {
  // Widgets that support underlined variant
  const underlinedWidgets = ['text', 'email', 'phone', 'url', 'textarea', 'number', 'password', 'date', 'time', 'select', 'multiselect', 'tags', 'tags-input', 'autocomplete', 'cascader', 'treeselect', 'mention', 'upload', 'file-upload'];
  
  if (underlinedWidgets.includes(widgetType)) {
    return underlinedProps;
  }
  
  return standardProps;
};

/**
 * Extract field-specific properties that should be passed to widgets
 */
export const extractFieldSpecificProps = (config: FieldConfig): Record<string, any> => {
  return Object.keys(config).reduce((acc, key) => {
    // Include properties that are specific to widgets (not general form properties)
    if (['rows', 'minRows', 'maxRows', 'autoSize', 'maxLength', 'showCount', 'allowClear', 'autoFocus', 'resize', 'wordWrap', 'showLineNumbers', 'enableCopy', 'enableFullscreen', 'min', 'max', 'step', 'prefix', 'suffix', 'count', 'marks', 'checkedChildren', 'unCheckedChildren', 'accept', 'length', 'targetKeys', 'direction', 'buttonStyle', 'cardStyle', 'optionWidth', 'optionHeight', 'optionsPerRow', 'showSelectionIndicator', 'enableKeyboardNav'].includes(key)) {
      acc[key] = (config as any)[key];
    }
    return acc;
  }, {} as Record<string, any>);
}; 