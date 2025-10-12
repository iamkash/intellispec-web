# AI Chatbot Integration for API 510 Inspection Wizard

## Overview

The AI chatbot widget has been successfully integrated into the API 510 inspection wizard form. This intelligent assistant can help users fill out forms, understand schema requirements, process voice input, analyze images, and provide contextual guidance.

## Features

### 🤖 **Intelligent Form Assistance**
- Understands form schema and field requirements
- Provides contextual help for specific fields and sections
- Suggests appropriate values based on form context
- Validates input and provides error guidance

### 🎤 **Voice Input Processing**
- Records voice notes and converts to text
- Processes voice input for form field population
- Supports multiple languages (configurable)
- High-accuracy transcription using OpenAI Whisper

### 📸 **Image Analysis**
- Upload and analyze inspection images
- Extract findings and observations from photos
- Identify equipment conditions and defects
- Suggest form field updates based on image content

### 📄 **Document Processing**
- Upload supporting documents
- Extract relevant information for form completion
- Reference documents during form filling
- Attach documents to specific form fields

### 💡 **Smart Suggestions**
- Context-aware suggestions based on current form state
- Field-specific guidance and validation help
- Navigation assistance between form sections
- Progress tracking and completion guidance

## Configuration

### API 510 Inspection Configuration

The AI chatbot is configured in the `api-510-inspection.json` file:

```json
{
  "gadgets": [
    {
      "id": "api-510-inspection-gadget",
      "type": "document-form-gadget",
      "config": {
        "aiAssistant": {
          "enabled": true,
          "position": "drawer",
          "title": "AI Inspection Assistant",
          "description": "Get help with form filling, voice input, and image analysis",
          "openaiConfig": {
            "apiKey": "${OPENAI_API_KEY}",
            "baseUrl": "https://api.openai.com/v1"
          },
          "modelConfig": {
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "maxTokens": 1000
          },
          "features": {
            "enableVoice": true,
            "enableImageUpload": true,
            "enableDocumentUpload": true,
            "enableSuggestions": true,
            "enableAutoFill": true
          }
        }
      }
    }
  ]
}
```

### Environment Variables

Set up your OpenAI API key in your environment:

```bash
# .env file
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_OPENAI_BASE_URL=https://api.openai.com/v1
```

## Usage

### 1. **Starting the Assistant**
- Click the floating AI assistant button (robot icon) in the bottom-right corner
- The assistant will open in a drawer panel

### 2. **Getting Help**
- Ask questions about form fields: "What is this field for?"
- Request guidance: "Help me with the safety preparation section"
- Get validation help: "Why is this field showing an error?"

### 3. **Voice Input**
- Click the microphone icon in the assistant
- Record your voice note
- The assistant will transcribe and process your input

### 4. **Image Analysis**
- Click the image upload icon
- Upload inspection photos
- The assistant will analyze and extract findings

### 5. **Document Upload**
- Click the document upload icon
- Upload supporting documents
- Reference them during form completion

## Technical Implementation

### Widget Integration

The AI chatbot is integrated as a widget in the `DocumentFormGadget`:

```typescript
// FormRenderer.tsx
<AIChatbotWidget
  id="form-ai-assistant"
  formSchema={formSchema}
  currentFormData={formData}
  currentSection={activeSection}
  onFieldUpdate={(fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }}
  // ... other props
/>
```

### Schema Understanding

The assistant automatically understands the form schema:

```typescript
// Automatically generated from fieldConfigs
const formSchema = Object.entries(fieldConfigs).map(([fieldId, config]) => ({
  id: fieldId,
  type: config.type || 'text',
  title: config.label || fieldId,
  required: config.required,
  sectionId: config.sectionId,
  // ... other properties
}));
```

### Context Awareness

The assistant maintains context about:
- Current form section
- Form data state
- Field relationships and dependencies
- Validation status
- Uploaded images and documents

## API 510 Specific Features

### Inspection Context
- Understands API 510 inspection requirements
- Provides guidance on inspection procedures
- Suggests appropriate findings and recommendations
- Helps with safety preparation and documentation

### Section Navigation
- Navigates between inspection sections
- Provides section-specific guidance
- Tracks progress through the inspection process
- Suggests next steps based on current section

### Findings Documentation
- Analyzes images for defect identification
- Suggests appropriate findings descriptions
- Helps with measurement documentation
- Assists with safety condition assessment

## Security & Privacy

- All API calls are made directly to OpenAI
- No data is stored on external servers
- Voice recordings are processed locally before transcription
- Images are analyzed but not stored permanently
- Form data remains in the local application

## Troubleshooting

### Common Issues

1. **Assistant not appearing**
   - Check if `aiAssistant.enabled` is set to `true`
   - Verify OpenAI API key is configured
   - Check browser console for errors

2. **Voice input not working**
   - Ensure microphone permissions are granted
   - Check if `enableVoice` is set to `true`
   - Verify OpenAI API key has Whisper access

3. **Image analysis failing**
   - Check if `enableImageUpload` is set to `true`
   - Verify OpenAI API key has Vision access
   - Ensure image format is supported (JPG, PNG, etc.)

4. **Form field updates not working**
   - Check if `onFieldUpdate` callback is properly configured
   - Verify field IDs match between schema and form
   - Check browser console for validation errors

### Debug Mode

Enable debug logging by setting:

```typescript
// In development
console.log('AI Assistant Debug:', {
  formSchema,
  currentFormData,
  currentSection
});
```

## Future Enhancements

- **Multi-language Support**: Add support for multiple languages
- **Offline Mode**: Cache responses for offline use
- **Custom Prompts**: Allow customization of AI prompts
- **Integration**: Connect with external inspection databases
- **Analytics**: Track usage patterns and improve assistance
- **Mobile Optimization**: Enhanced mobile experience

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team. 