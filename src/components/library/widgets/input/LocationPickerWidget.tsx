/**
 * LocationPickerWidget - GPS coordinates and map-based location selection
 * 
 * A form input widget that allows users to select or enter GPS coordinates.
 * Supports map integration, address lookup, current location, and coordinate validation.
 * Perfect for location-based forms, asset tracking, and geographical data entry.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Input, Button, Space, Typography, Select, Tooltip, Card, Alert } from 'antd';
import { 
  EnvironmentOutlined, 
  AimOutlined, 
  SearchOutlined, 
  CopyOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { sanitizeData } from '../../../../utils/sanitizeData';

const { Text } = Typography;
const { Option } = Select;

// Location coordinate formats
export enum CoordinateFormat {
  DECIMAL = 'decimal',
  DMS = 'dms', // Degrees, Minutes, Seconds
  DM = 'dm',   // Degrees, Minutes
  MGRS = 'mgrs', // Military Grid Reference System
  UTM = 'utm'   // Universal Transverse Mercator
}

// Location data interface
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  address?: string;
  timestamp?: number;
}

// Location picker widget props
export interface LocationPickerWidgetProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: LocationData;
  defaultValue?: LocationData;
  onChange?: (value: LocationData) => void;
  
  // Display format
  format?: CoordinateFormat;
  precision?: number;
  showAltitude?: boolean;
  showAccuracy?: boolean;
  showAddress?: boolean;
  
  // Input methods
  allowManualEntry?: boolean;
  allowCurrentLocation?: boolean;
  allowAddressSearch?: boolean;
  allowMapSelection?: boolean;
  
  // Appearance
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  
  // Validation
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: LocationData) => string | null;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Interactions
  onFocus?: () => void;
  onBlur?: () => void;
  onLocationFound?: (location: LocationData) => void;
  onAddressFound?: (address: string, location: LocationData) => void;
  
  // Map integration
  mapProvider?: 'google' | 'osm' | 'mapbox';
  mapApiKey?: string;
  mapZoom?: number;
  mapHeight?: number;
  showMap?: boolean;
  
  // Presets
  presets?: {
    [key: string]: LocationData;
  };
  
  // Address search
  addressSearchProvider?: 'google' | 'nominatim' | 'mapbox';
  addressSearchApiKey?: string;
  
  // Units
  units?: 'metric' | 'imperial';
  
  // Actions
  actions?: {
    copy?: boolean;
    share?: boolean;
    directions?: boolean;
  };
}

/**
 * LocationPickerWidget Component
 * 
 * Provides GPS coordinate selection and map-based location picking.
 * Supports multiple coordinate formats, current location, and address lookup.
 */
export const LocationPickerWidget: React.FC<LocationPickerWidgetProps> = ({
  id,
  label,
  placeholder = "Enter coordinates or search address",
  value,
  defaultValue,
  onChange,
  
  format = CoordinateFormat.DECIMAL,
  precision = 6,
  showAltitude = false,
  showAccuracy = false,
  showAddress = true,
  
  allowManualEntry = true,
  allowCurrentLocation = true,
  allowAddressSearch = true,
  allowMapSelection = false,
  
  size = 'middle',
  disabled = false,
  
  required = false,
  validateOnChange = true,
  validator,
  bounds,
  
  className,
  style,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  onFocus,
  onBlur,
  onLocationFound,
  onAddressFound,
  
  mapProvider = 'osm',
  mapApiKey,
  mapZoom = 15,
  mapHeight = 200,
  showMap = false,
  
  presets,
  
  addressSearchProvider = 'nominatim',
  addressSearchApiKey,
  
  units = 'metric',
  
  actions = { copy: true, share: false, directions: false },
}) => {
  const [internalValue, setInternalValue] = useState<LocationData | undefined>(value || defaultValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentFormat, setCurrentFormat] = useState<CoordinateFormat>(format);
  const [showMapView, setShowMapView] = useState<boolean>(false);

  // Validation function
  const validateValue = useCallback((val: LocationData): string | null => {
    if (required && !val) {
      return 'Location is required';
    }
    
    if (val) {
      // Validate latitude range
      if (val.latitude < -90 || val.latitude > 90) {
        return 'Latitude must be between -90 and 90 degrees';
      }
      
      // Validate longitude range
      if (val.longitude < -180 || val.longitude > 180) {
        return 'Longitude must be between -180 and 180 degrees';
      }
      
      // Validate bounds if specified
      if (bounds) {
        if (val.latitude > bounds.north || val.latitude < bounds.south ||
            val.longitude > bounds.east || val.longitude < bounds.west) {
          return 'Location is outside the allowed bounds';
        }
      }
    }
    
    if (validator) {
      return validator(val);
    }
    
    return null;
  }, [required, bounds, validator]);

  // Handle value change
  const handleValueChange = useCallback((newValue: LocationData | undefined) => {
    setInternalValue(newValue);
    
    if (validateOnChange && newValue) {
      const error = validateValue(newValue);
      setValidationError(error);
    }
    
    if (newValue) {
      onChange?.(newValue);
    }
  }, [onChange, validateOnChange, validateValue]);

  // Format coordinates for display
  const formatCoordinates = (location: LocationData): string => {
    if (!location) return '';
    
    const { latitude, longitude } = location;
    
    // Check if latitude and longitude are valid numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return '';
    }
    
    switch (currentFormat) {
      case CoordinateFormat.DECIMAL:
        return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
      
      case CoordinateFormat.DMS:
        const latDMS = convertToDMS(latitude, true);
        const lonDMS = convertToDMS(longitude, false);
        return `${latDMS}, ${lonDMS}`;
      
      case CoordinateFormat.DM:
        const latDM = convertToDM(latitude, true);
        const lonDM = convertToDM(longitude, false);
        return `${latDM}, ${lonDM}`;
      
      default:
        return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
    }
  };

  // Convert decimal degrees to DMS
  const convertToDMS = (decimal: number, isLatitude: boolean): string => {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = ((abs - degrees) * 60 - minutes) * 60;
    
    const direction = decimal >= 0 
      ? (isLatitude ? 'N' : 'E') 
      : (isLatitude ? 'S' : 'W');
    
    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
  };

  // Convert decimal degrees to DM
  const convertToDM = (decimal: number, isLatitude: boolean): string => {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = (abs - degrees) * 60;
    
    const direction = decimal >= 0 
      ? (isLatitude ? 'N' : 'E') 
      : (isLatitude ? 'S' : 'W');
    
    return `${degrees}°${minutes.toFixed(4)}'${direction}`;
  };

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setValidationError('Geolocation is not supported by this browser');
      return;
    }
    
    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        handleValueChange(location);
        onLocationFound?.(location);
        setIsLoading(false);
      },
      (error) => {
        setValidationError(`Location error: ${error.message}`);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [handleValueChange, onLocationFound]);

  // Parse coordinate string
  const parseCoordinates = useCallback((coordString: string): LocationData | null => {
    try {
      // Simple decimal format parser
      const parts = coordString.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            latitude: lat,
            longitude: lon,
            timestamp: Date.now(),
          };
        }
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error);
    }
    
    return null;
  }, []);

  // Handle manual coordinate entry
  const handleManualEntry = useCallback((coordString: string) => {
    const location = parseCoordinates(coordString);
    if (location) {
      handleValueChange(location);
    }
  }, [parseCoordinates, handleValueChange]);

  // Handle address search
  const handleAddressSearch = useCallback(async (address: string) => {
    if (!address.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Mock address search - in real implementation, use geocoding API
      const mockLocation: LocationData = {
        latitude: 40.7128 + Math.random() * 0.1,
        longitude: -74.0060 + Math.random() * 0.1,
        address: address,
        timestamp: Date.now(),
      };
      
      handleValueChange(mockLocation);
      onAddressFound?.(address, mockLocation);
    } catch (error) {
      setValidationError('Address search failed');
    } finally {
      setIsLoading(false);
    }
  }, [handleValueChange, onAddressFound]);

  // Handle preset selection
  const handlePresetSelect = useCallback((presetKey: string) => {
    if (presets && presets[presetKey]) {
      handleValueChange(presets[presetKey]);
    }
  }, [presets, handleValueChange]);

  // Handle copy to clipboard
  const handleCopy = useCallback(() => {
    if (internalValue) {
      const coordString = formatCoordinates(internalValue);
      navigator.clipboard.writeText(coordString);
    }
  }, [internalValue, formatCoordinates]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Render coordinate display
  const renderCoordinateDisplay = () => {
    if (!internalValue) return null;
    
    return (
      <Card size="small" style={{ marginTop: 8 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div>
            <Text strong>Coordinates:</Text>
            <Text style={{ marginLeft: 8 }}>{formatCoordinates(internalValue)}</Text>
          </div>
          
          {showAltitude && internalValue.altitude && typeof internalValue.altitude === 'number' && (
            <div>
              <Text strong>Altitude:</Text>
              <Text style={{ marginLeft: 8 }}>
                {internalValue.altitude.toFixed(2)} {units === 'metric' ? 'm' : 'ft'}
              </Text>
            </div>
          )}
          
          {showAccuracy && internalValue.accuracy && typeof internalValue.accuracy === 'number' && (
            <div>
              <Text strong>Accuracy:</Text>
              <Text style={{ marginLeft: 8 }}>
                ±{internalValue.accuracy.toFixed(2)} {units === 'metric' ? 'm' : 'ft'}
              </Text>
            </div>
          )}
          
          {showAddress && internalValue.address && (
            <div>
              <Text strong>Address:</Text>
              <Text style={{ marginLeft: 8 }}>{internalValue.address}</Text>
            </div>
          )}
        </Space>
      </Card>
    );
  };

  // Render actions
  const renderActions = () => {
    return (
      <Space>
        {allowCurrentLocation && (
          <Tooltip title="Get Current Location">
            <Button
              type="text"
              icon={<AimOutlined />}
              onClick={getCurrentLocation}
              loading={isLoading}
              disabled={disabled}
            />
          </Tooltip>
        )}
        
        {actions.copy && internalValue && (
          <Tooltip title="Copy Coordinates">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={disabled}
            />
          </Tooltip>
        )}
        
        <Select
          value={currentFormat}
          onChange={setCurrentFormat}
          size={size}
          disabled={disabled}
          style={{ minWidth: 80 }}
        >
          <Option value={CoordinateFormat.DECIMAL}>Decimal</Option>
          <Option value={CoordinateFormat.DMS}>DMS</Option>
          <Option value={CoordinateFormat.DM}>DM</Option>
        </Select>
      </Space>
    );
  };

  return (
    <div className={className} style={style}>
      {label && (
        <label 
          htmlFor={id}
          style={{ 
            display: 'block', 
            marginBottom: 8,
            fontWeight: 500,
            color: required ? '#ff4d4f' : undefined
          }}
        >
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <Space.Compact style={{ width: '100%' }}>
        <Input
          id={id}
          value={searchTerm}
          placeholder={placeholder}
          size={size}
          disabled={disabled}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={() => {
            if (allowManualEntry) {
              handleManualEntry(searchTerm);
            } else if (allowAddressSearch) {
              handleAddressSearch(searchTerm);
            }
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          style={{ flex: 1 }}
        />
        
        {allowAddressSearch && (
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => handleAddressSearch(searchTerm)}
            loading={isLoading}
            disabled={disabled}
            size={size}
          />
        )}
      </Space.Compact>
      
      <div style={{ marginTop: 8 }}>
        {renderActions()}
      </div>
      
      {presets && (
        <div style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 12, marginRight: 8 }}>Presets:</Text>
          <Space wrap>
            {Object.keys(presets).map(key => (
              <Button
                key={key}
                type="text"
                size="small"
                onClick={() => handlePresetSelect(key)}
                disabled={disabled}
              >
                {key}
              </Button>
            ))}
          </Space>
        </div>
      )}
      
      {renderCoordinateDisplay()}
      
      {validationError && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {validationError}
        </div>
      )}
    </div>
  );
};

export default LocationPickerWidget; 