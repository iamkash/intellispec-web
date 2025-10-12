const mongoose = require('mongoose');

/**
 * Calculator Schema
 * Captures tenant-scoped calculator definitions with optional system defaults.
 */
const CalculatorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    module: { type: String, index: true },
    category: { type: String, index: true },
    description: { type: String },
    icon: { type: String },
    tags: { type: [String], default: [] },
    uiDefinition: { type: mongoose.Schema.Types.Mixed },
    formConfig: { type: mongoose.Schema.Types.Mixed },
    calculations: { type: mongoose.Schema.Types.Mixed },
    calculationEngine: { type: mongoose.Schema.Types.Mixed },
    aiPrompts: { type: mongoose.Schema.Types.Mixed },
    aiPrompt: { type: String },
    deleted: { type: Boolean, default: false }
  },
  {
    collection: 'calculators',
    timestamps: { createdAt: 'created_date', updatedAt: 'last_updated' }
  }
);

CalculatorSchema.index({ tenantId: 1, id: 1 }, { unique: false });
CalculatorSchema.index({ tenantId: 1, module: 1, deleted: 1, name: 1 });

module.exports = mongoose.models.Calculator || mongoose.model('Calculator', CalculatorSchema);
