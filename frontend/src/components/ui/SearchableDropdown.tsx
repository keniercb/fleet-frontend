import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { PageResponse, PageParams } from '@/types';
import type { AxiosResponse } from 'axios';

interface SearchableDropdownProps<T> {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  fetchFn: (params?: PageParams) => Promise<AxiosResponse<PageResponse<T>>>;
  getId: (item: T) => number;
  getLabel: (item: T) => string;
  filterActive?: (item: T) => boolean;
  disabled?: boolean;
  pageSize?: number;
}

export default function SearchableDropdown<T extends { id: number }>({
  label,
  value,
  onChange,
  placeholder = 'Buscar...',
  required = false,
  fetchFn,
  getId,
  getLabel,
  filterActive,
  disabled = false,
  pageSize = 50,
}: SearchableDropdownProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve the currently selected label from fetched items
  const selectedItem = value ? items.find((i) => getId(i) === value) : undefined;
  const selectedLabel = selectedItem ? getLabel(selectedItem) : '';

  // Whether user is actively typing (dropdown open mode)
  const isTyping = isOpen;

  // Fetch items
  const fetchItems = useCallback(
    async (filter: string) => {
      setLoading(true);
      try {
        const res = await fetchFn({ page: 0, perPage: pageSize, filter });
        let content = res.data.content;
        if (filterActive) content = content.filter(filterActive);
        setItems(content);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, pageSize, filterActive]
  );

  // Load initial items on mount
  useEffect(() => {
    fetchItems('');
  }, [fetchItems]);

  // Debounced search when typing
  useEffect(() => {
    if (!isTyping) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(searchText);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText, isTyping, fetchItems]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    onChange(getId(item));
    setIsOpen(false);
    setSearchText('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(0);
    setSearchText('');
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // The display value: when typing show searchText, otherwise show selected label or placeholder
  const displayValue = isTyping ? searchText : (value ? selectedLabel : '');

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={isTyping ? placeholder : (value ? selectedLabel : placeholder)}
          disabled={disabled}
          className="input-field pr-8 text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && !isTyping && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                Buscando...
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">
                No se encontraron resultados
              </div>
            ) : (
              items.map((item) => {
                const id = getId(item);
                const isSelected = id === value;
                return (
                  <button
                    key={id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {getLabel(item)}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
