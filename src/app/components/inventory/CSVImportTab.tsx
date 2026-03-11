import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { SourceInventoryItem } from './SourceTable';

interface CSVImportTabProps {
  onImport: (items: SourceInventoryItem[]) => void;
}

export function CSVImportTab({ onImport }: CSVImportTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<SourceInventoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    setPreviewData(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const items = parseCSV(text);
        setPreviewData(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string): SourceInventoryItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['sku', 'itemname', 'category', 'whattocount', 'countingminoruom', 'countingmajoruom'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const items: SourceInventoryItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const getVal = (header: string, defaultVal: any = '') => {
        const idx = headers.indexOf(header);
        return idx >= 0 ? values[idx] : defaultVal;
      };

      const getNum = (header: string, defaultVal: number = 0) => {
        const val = getVal(header, defaultVal.toString());
        const num = parseFloat(val);
        return isNaN(num) ? defaultVal : num;
      };

      const item: SourceInventoryItem = {
        id: (i).toString(),
        sku: getVal('sku'),
        itemName: getVal('itemname'),
        category: getVal('category'),
        whatToCount: getVal('whattocount'),
        countingMinorUnit: getNum('countingminorunit', 1),
        countingMinorUOM: getVal('countingminoruom'),
        countingMajorUnit: getNum('countingmajorunit', 1),
        countingMajorUOM: getVal('countingmajoruom'),
        orderingMinorCount: getNum('orderingminorcount', 1),
        orderingCount: getNum('orderingcount', 1),
        orderingUnitOfPurchase: getVal('orderingunitofpurchase', 'case'),
        minOrder: getNum('minorder', 1),
        lastVendorPrice: getNum('lastvendorprice', 0),
        par: getNum('par', 0),
        lastPhysicalCount: getNum('lastphysicalcount', 0),
        estOnHand: getNum('estonhand', 0),
        avgDailyUsage: getNum('avgdailyusage', 0),
      };

      items.push(item);
    }

    if (items.length === 0) {
      throw new Error('No valid data rows found in CSV');
    }

    return items;
  };

  const downloadTemplate = () => {
    const template = `sku,itemName,category,whatToCount,countingMinorUnit,countingMinorUOM,countingMajorUnit,countingMajorUOM,orderingMinorCount,orderingCount,orderingUnitOfPurchase,minOrder,lastVendorPrice,par,lastPhysicalCount,estOnHand,avgDailyUsage
P001,Iceberg Lettuce,Produce,HEADS,1,lb,1,Head,24,1,case,2,28.50,50,52,50,10
P002,Strawberries,Produce,BASKETS,1,lb,1,Basket,5,1,flat,1,18.75,15,17,16,4
T001,Ground Beef,Proteins,PATTIES,1,lb,1,Patty,40,1,case,2,84.00,120,125,122,15
D001,Cheddar Cheese,Dairy,BLOCKS,1,lb,1,Block,4,1,case,3,19.00,20,22,21,2.5`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (previewData) {
      if (confirm(`This will replace all existing inventory data with ${previewData.length} new items. Are you sure?`)) {
        onImport(previewData);
        setPreviewData(null);
        setError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How to Import Inventory Data</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Download the template CSV file below</li>
          <li>Open it in Google Sheets (File → Import)</li>
          <li>Fill in your inventory data following the column format</li>
          <li>Export as CSV (File → Download → Comma Separated Values)</li>
          <li>Upload the CSV file here to import your data</li>
        </ol>
      </div>

      {/* Download Template Button */}
      <div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template CSV
        </button>
        <p className="text-xs text-gray-600 mt-2">
          Template includes sample data with all required columns
        </p>
      </div>

      {/* Column Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Required Columns:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-medium text-gray-700">sku</span>
            <p className="text-gray-600">Item SKU (e.g., P001)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">itemName</span>
            <p className="text-gray-600">Item name</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">category</span>
            <p className="text-gray-600">Category name</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">whatToCount</span>
            <p className="text-gray-600">What to count (e.g., HEADS)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">countingMinorUnit</span>
            <p className="text-gray-600">Minor unit number (default: 1)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">countingMinorUOM</span>
            <p className="text-gray-600">Minor unit (e.g., lb)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">countingMajorUnit</span>
            <p className="text-gray-600">Major unit number (default: 1)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">countingMajorUOM</span>
            <p className="text-gray-600">Major unit (e.g., Head)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">orderingMinorCount</span>
            <p className="text-gray-600">Units per case</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">orderingCount</span>
            <p className="text-gray-600">Ordering count (default: 1)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">orderingUnitOfPurchase</span>
            <p className="text-gray-600">Purchase unit (e.g., case)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">minOrder</span>
            <p className="text-gray-600">Minimum order quantity</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">lastVendorPrice</span>
            <p className="text-gray-600">Price per case</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">par</span>
            <p className="text-gray-600">PAR level</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">lastPhysicalCount</span>
            <p className="text-gray-600">Last count (optional)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">estOnHand</span>
            <p className="text-gray-600">Estimated on hand (optional)</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">avgDailyUsage</span>
            <p className="text-gray-600">Daily usage (optional)</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {!previewData && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Drag and drop your CSV file here
          </p>
          <p className="text-xs text-gray-600 mb-4">or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Browse Files
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-900">Import Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900">Preview Data</h4>
              <p className="text-sm text-green-700 mt-1">
                Found {previewData.length} items ready to import
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-green-200 overflow-hidden mb-4">
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Item Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">PAR</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Unit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-900">{item.sku}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.itemName}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.category}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{item.par}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">${item.lastVendorPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.countingMajorUOM}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Import {previewData.length} Items
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
