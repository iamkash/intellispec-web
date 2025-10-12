import React from 'react';
import { BaseGadget } from '../../gadgets/base';

export interface ObservationWidgetProps {
  id: string;
  referenceListType?: string;
  optionsUrl?: string;
  optionsPath?: string;
  optionsValueField?: string;
  optionsLabelField?: string;
  data?: any;
  onChange?: (data: any) => void;
}

// Functional component that can be used with React.lazy
const ObservationWidget: React.FC<ObservationWidgetProps> = (props) => {
  return <ObservationWidgetRenderer {...props} />;
};

// Functional component that handles the async loading
const ObservationWidgetRenderer: React.FC<ObservationWidgetProps> = ({
  referenceListType,
  optionsUrl,
  optionsPath = 'options',
  data,
  onChange,
  id
}) => {
  const [observationData, setObservationData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [localFormData, setLocalFormData] = React.useState<any>(data || {});
  const lastSentDataRef = React.useRef<string>(JSON.stringify(data || {}));

  // Sync local state with prop data (flatten nested data if needed)
  React.useEffect(() => {
    if (data && typeof data === 'object') {
      let actualData = data;

      // If data is nested (from wizard re-wrapping), extract the actual observation data
      if (data.observations_data && typeof data.observations_data === 'object') {
actualData = data.observations_data;

        // Continue flattening if still nested
        while (actualData.observations_data && typeof actualData.observations_data === 'object') {
          actualData = actualData.observations_data;
        }
      }

      const dataString = JSON.stringify(actualData);
      if (dataString !== JSON.stringify(localFormData)) {
setLocalFormData(actualData);
        // Reset the ref when parent data changes
        lastSentDataRef.current = dataString;
      }
    }
  }, [data]); // Only depend on data prop

  React.useEffect(() => {
    const loadData = async () => {
      // Determine the API URL to use
      let apiUrl = optionsUrl;
      if (!apiUrl && referenceListType) {
        apiUrl = `/api/reference-data/list-options/${referenceListType}`;
      }

      if (!apiUrl) return;

      setLoading(true);
      try {
        // Use authenticated API endpoint for reference data
        const response = await BaseGadget.makeAuthenticatedFetch(apiUrl);
        if (response.ok) {
          const apiData = await response.json();

          // Extract options using the specified path
          const options = optionsPath ? apiData[optionsPath] || apiData : apiData;
console.log('ObservationWidget: Options count:', options?.length || 0);

          // Transform API response to expected format
          const transformedData = {
            categories: groupOptionsByCategory(options || []),
            ratings: getRatingOptions()
          };
console.log('ObservationWidget: Categories count:', transformedData.categories?.length || 0);

          setObservationData(transformedData);
        } else {
          console.error('Failed to load observation data from API:', response.status, response.statusText);
          if (response.status === 401) {
            console.error('Authentication required. Please ensure you are logged in.');
          }
        }
      } catch (error) {
        console.error('Failed to load observation data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [referenceListType, optionsUrl, optionsPath]);

  // Helper function to group options by category from API response
  const groupOptionsByCategory = (options: any[]) => {
    const categoriesMap = new Map();

    options.forEach(option => {
      const category = option.metadata?.category || option.parentGroup || 'general';
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          id: category,
          name: formatCategoryName(category),
          items: []
        });
      }
      categoriesMap.get(category).items.push({
        id: option.value,
        code: option.metadata?.code || option.value,
        label: option.label.replace(/^(P\d+\s*-\s*)/, ''), // Remove code prefix if present
        description: option.description,
        category: category
      });
    });

    return Array.from(categoriesMap.values());
  };

  // Helper function to format category names
  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' & ');
  };

  // Helper function to get rating options
  const getRatingOptions = () => {
    return [
      { value: 'good', label: 'Good' },
      { value: 'fair', label: 'Fair' },
      { value: 'poor', label: 'Poor' },
      { value: 'na', label: 'NA' }
    ];
  };

  if (!referenceListType && !optionsUrl) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'hsl(var(--muted) / 0.3)',
        borderRadius: '6px',
        color: 'hsl(var(--muted-foreground))'
      }}>
        No referenceListType or optionsUrl specified for observation widget
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'hsl(var(--muted) / 0.3)',
        borderRadius: '6px',
        color: 'hsl(var(--muted-foreground))'
      }}>
        Loading observation checklist...
      </div>
    );
  }

  if (!observationData || !observationData.categories || observationData.categories.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'hsl(var(--muted) / 0.3)',
        borderRadius: '6px',
        color: 'hsl(var(--muted-foreground))'
      }}>
        No observation checklist data found for: {referenceListType || 'optionsUrl'}
        <br />
        <small>Check console for debug info</small>
      </div>
    );
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    const newFormData = { ...localFormData, [fieldId]: value };
    setLocalFormData(newFormData);

    // Prevent sending duplicate data to avoid nesting
    const dataString = JSON.stringify(newFormData);
    if (onChange && dataString !== lastSentDataRef.current) {
lastSentDataRef.current = dataString;
      onChange(newFormData); // Pass the complete observation data to parent
    } else {
}
  };

  console.log('ObservationWidget: Rendering with data:', {
    hasData: !!observationData,
    categoriesCount: observationData?.categories?.length || 0,
    loading,
    localFormDataKeys: Object.keys(localFormData || {}),
    localFormData: localFormData
  });

  return (
    <div style={{ width: '100%' }}>
      {observationData?.categories?.map((category: any) => {
        return (
          <div key={category.id}>
          {/* Category Header */}
          <div style={{
            margin: '20px 0 10px 0',
            padding: '8px 12px',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            border: '1px solid hsl(var(--primary) / 0.3)',
            borderRadius: '6px',
            fontWeight: '600',
            color: 'hsl(var(--primary))',
            fontSize: '14px'
          }}>
            {category.name}
          </div>

          {/* Category Items */}
          {category.items?.map((item: any) => (
            <div key={item.id} style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: 'hsl(var(--background))'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr',
                gap: '8px',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                {/* Item Label */}
                <div style={{ fontWeight: '500', color: 'hsl(var(--foreground))' }}>
                  {item.code} - {item.label}
                </div>

                {/* Rating Options */}
                {observationData.ratings?.map((rating: any) => (
                  <label key={rating.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: localFormData[`${item.id}_rating`] === rating.value ?
                      'hsl(var(--primary) / 0.1)' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name={`${item.id}_rating`}
                      value={rating.value}
                      checked={localFormData[`${item.id}_rating`] === rating.value}
                      onChange={(e) => {
handleFieldChange(`${item.id}_rating`, e.target.value);
                      }}
                      style={{ margin: 0 }}
                    />
                    <span style={{
                      fontSize: '11px',
                      color: 'hsl(var(--foreground))',
                      fontWeight: localFormData[`${item.id}_rating`] === rating.value ? '600' : '400'
                    }}>
                      {rating.label}
                    </span>
                  </label>
                ))}

                {/* Comments */}
                <input
                  type="text"
                  placeholder="Comments..."
                  value={localFormData[`${item.id}_comments`] || ''}
                  onChange={(e) => handleFieldChange(`${item.id}_comments`, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    width: '100%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        );
      })}

      {/* Debug Data Display */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: 'hsl(var(--muted) / 0.3)',
        borderRadius: '6px'
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          color: 'hsl(var(--foreground))'
        }}>
          Observation Data
        </h4>
        <pre style={{
          fontSize: '12px',
          color: 'hsl(var(--muted-foreground))',
          margin: 0,
          overflow: 'auto'
        }}>
          {JSON.stringify(localFormData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ObservationWidget;
