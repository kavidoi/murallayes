import React, { useState, useEffect } from 'react';
import { Hash, Settings, Eye, Save, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { SKUTemplate, EntitySKU } from '../../types/relationship';

interface SKUGeneratorProps {
  entityType: string;
  entityId: string;
  onSKUGenerated?: (sku: EntitySKU) => void;
  className?: string;
}

export const SKUGenerator: React.FC<SKUGeneratorProps> = ({
  entityType,
  entityId,
  onSKUGenerated,
  className = '',
}) => {
  const [templates, setTemplates] = useState<SKUTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customComponents, setCustomComponents] = useState<Record<string, any>>({});
  const [previewSKU, setPreviewSKU] = useState<string>('');
  const [existingSKU, setExistingSKU] = useState<EntitySKU | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadExistingSKU();
  }, [entityType, entityId]);

  useEffect(() => {
    if (selectedTemplateId) {
      generatePreview();
    }
  }, [selectedTemplateId, customComponents]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/sku/templates?entityType=${entityType}`);
      if (response.ok) {
        const templateList = await response.json();
        setTemplates(templateList);
        
        // Auto-select default template
        const defaultTemplate = templateList.find((t: SKUTemplate) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      }
    } catch (error) {
      console.error('Failed to load SKU templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSKU = async () => {
    try {
      const response = await fetch(`/api/sku/entity/${entityType}/${entityId}`);
      if (response.ok) {
        const sku = await response.json();
        setExistingSKU(sku);
      }
    } catch (error) {
      // No existing SKU is fine
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplateId) return;

    try {
      const response = await fetch('/api/sku/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          templateId: selectedTemplateId,
          customComponents,
        }),
      });

      if (response.ok) {
        const preview = await response.json();
        setPreviewSKU(preview.sku);
      }
    } catch (error) {
      console.error('Failed to generate SKU preview:', error);
    }
  };

  const generateSKU = async () => {
    if (!selectedTemplateId) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/sku/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          templateId: selectedTemplateId,
          customComponents,
        }),
      });

      if (response.ok) {
        const generatedSKU = await response.json();
        setExistingSKU(generatedSKU);
        onSKUGenerated?.(generatedSKU);
      }
    } catch (error) {
      console.error('Failed to generate SKU:', error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const renderComponentEditor = () => {
    if (!selectedTemplate || !selectedTemplate.components) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Custom Components</h4>
        {Object.entries(selectedTemplate.components).map(([key, definition]) => {
          const def = definition as any;
          
          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {key}
                {def.description && (
                  <span className="text-xs text-gray-500 block">{def.description}</span>
                )}
              </label>
              
              {def.type === 'static' ? (
                <input
                  type="text"
                  value={def.value || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              ) : def.type === 'sequence' ? (
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  Auto-generated sequence (length: {def.length || 4})
                </div>
              ) : def.type === 'date' ? (
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  Current date ({def.format || 'YYMMDD'})
                </div>
              ) : (
                <input
                  type="text"
                  value={customComponents[key] || ''}
                  onChange={(e) => setCustomComponents(prev => ({
                    ...prev,
                    [key]: e.target.value,
                  }))}
                  placeholder={def.default || `Enter ${key}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Hash className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            SKU Generator
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          {entityType} • {entityId}
        </div>
      </div>

      {/* Existing SKU */}
      {existingSKU && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-green-800">Current SKU</h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-mono text-green-900">
                  {existingSKU.skuValue}
                </span>
                <button
                  onClick={() => copyToClipboard(existingSKU.skuValue)}
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                  title="Copy SKU"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>
              {existingSKU.template && (
                <p className="text-sm text-green-700 mt-1">
                  Generated from: {existingSKU.template.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} {template.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Template Info</h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTemplate.description}
              </p>
            </div>
            
            <div>
              <h5 className="text-xs font-medium text-gray-700">Template Pattern:</h5>
              <code className="text-sm bg-white px-2 py-1 rounded border font-mono">
                {selectedTemplate.template}
              </code>
            </div>

            {selectedTemplate.exampleOutput && (
              <div>
                <h5 className="text-xs font-medium text-gray-700">Example Output:</h5>
                <code className="text-sm bg-white px-2 py-1 rounded border font-mono text-green-600">
                  {selectedTemplate.exampleOutput}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Component Editor */}
      {selectedTemplate && renderComponentEditor()}

      {/* Preview */}
      {previewSKU && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            <Eye className="inline w-4 h-4 mr-1" />
            Preview
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-mono text-blue-900 bg-white px-3 py-1 rounded border">
              {previewSKU}
            </span>
            <button
              onClick={() => copyToClipboard(previewSKU)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy preview"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={generatePreview}
          disabled={!selectedTemplateId}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Preview
        </button>

        <button
          onClick={generateSKU}
          disabled={!selectedTemplateId || generating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {existingSKU ? 'Regenerate SKU' : 'Generate SKU'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SKUGenerator;