import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { validationEngine, validateAllSchemas, generateTypeScriptTypes } from '../../schemas';
import { errorHandler } from '../../lib/error-handler';

/**
 * مكون عرض حالة Zod schemas
 */
export const ZodSchemaValidator: React.FC = () => {
  const [validationResults, setValidationResults] = useState<Array<{
    schema: string;
    isValid: boolean;
    errors?: string[];
  }> | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [generatedTypes, setGeneratedTypes] = useState<string>('');

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const results = validateAllSchemas();
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const generateTypes = () => {
    try {
      const types = generateTypeScriptTypes();
      setGeneratedTypes(types);
    } catch (error) {
      console.error('Type generation failed:', error);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Zod Schema Validator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={runValidation} 
                disabled={isValidating}
                variant="outline"
              >
                {isValidating ? 'جاري التحقق...' : 'تحقق من جميع Schemas'}
              </Button>
              <Button 
                onClick={generateTypes}
                variant="outline"
              >
                إنشاء TypeScript Types
              </Button>
            </div>

            {validationResults && (
              <div className="space-y-2">
                <h4 className="font-semibold">نتائج التحقق:</h4>
                {validationResults.map((result, index) => (
                  <Alert 
                    key={index}
                    variant={result.isValid ? "default" : "destructive"}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.schema}</span>
                      <span className="text-sm">
                        {result.isValid ? '✅ صالح' : '❌ غير صالح'}
                      </span>
                    </div>
                    {!result.isValid && result.errors && (
                      <div className="mt-2 text-sm">
                        <strong>الأخطاء:</strong>
                        <ul className="list-disc list-inside">
                          {result.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Alert>
                ))}
              </div>
            )}

            {generatedTypes && (
              <div className="space-y-2">
                <h4 className="font-semibold">Generated Types:</h4>
                <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto max-h-96">
                  <pre>{generatedTypes}</pre>
                </div>
                <Button
                  onClick={() => navigator.clipboard.writeText(generatedTypes)}
                  variant="outline"
                  size="sm"
                >
                  نسخ إلى الحافظة
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * مكون اختبار Zod validation بشكل تفاعلي
 */
export const ZodValidationTester: React.FC = () => {
  const [schemaName, setSchemaName] = useState('loginForm');
  const [testData, setTestData] = useState('{}');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const schemas = [
    { name: 'loginForm', description: 'Login Form Schema' },
    { name: 'createLead', description: 'Create Lead Schema' },
    { name: 'sendMessage', description: 'Send Message Schema' },
    { name: 'integrationConfig', description: 'Integration Config Schema' },
    { name: 'userProfile', description: 'User Profile Schema' }
  ];

  const sampleData: Record<string, string> = {
    loginForm: JSON.stringify({
      email: "test@example.com",
      password: "password123",
      rememberMe: true
    }, null, 2),
    createLead: JSON.stringify({
      name: "أحمد محمد",
      email: "ahmed@example.com",
      phone: "+966501234567",
      company: "شركة المستقبل",
      source: "website"
    }, null, 2),
    sendMessage: JSON.stringify({
      conversationId: "123e4567-e89b-12d3-a456-426614174000",
      content: "مرحباً، كيف يمكنني مساعدتك؟",
      type: "text"
    }, null, 2),
    integrationConfig: JSON.stringify({
      name: "تكامل WhatsApp",
      type: "whatsapp",
      provider: "whatsapp",
      credentials: {
        apiKey: "test_api_key_123456789"
      }
    }, null, 2),
    userProfile: JSON.stringify({
      firstName: "أحمد",
      lastName: "محمد",
      email: "ahmed@example.com",
      phone: "+966501234567"
    }, null, 2)
  };

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const parsedData = JSON.parse(testData);
      const result = await validationEngine.validate(schemaName, parsedData, {
        includeWarnings: true
      });
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        success: false,
        errors: [{ 
          field: 'system', 
          message: error instanceof Error ? error.message : 'خطأ في تحليل JSON', 
          code: 'JSON_PARSE_ERROR',
          path: []
        }]
      });
    } finally {
      setIsValidating(false);
    }
  };

  const loadSampleData = () => {
    setTestData(sampleData[schemaName] || '{}');
  };

  useEffect(() => {
    loadSampleData();
    setValidationResult(null);
  }, [schemaName]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Zod Validation Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اختر Schema:</label>
              <select 
                value={schemaName} 
                onChange={(e) => setSchemaName(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {schemas.map(schema => (
                  <option key={schema.name} value={schema.name}>
                    {schema.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button onClick={loadSampleData} variant="outline">
                تحميل بيانات تجريبية
              </Button>
              <Button onClick={runValidation} disabled={isValidating}>
                {isValidating ? 'جاري التحقق...' : 'تحقق من البيانات'}
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Test Data (JSON):</label>
              <textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                className="w-full h-40 p-3 border rounded font-mono text-sm"
                placeholder="أدخل البيانات التجريبية هنا..."
              />
            </div>

            {validationResult && (
              <div className="space-y-3">
                <Alert variant={validationResult.success ? "default" : "destructive"}>
                  <div className="font-medium">
                    {validationResult.success ? '✅ التحقق نجح' : '❌ التحقق فشل'}
                  </div>
                </Alert>

                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600">الأخطاء:</h4>
                    {validationResult.errors.map((error: any, index: number) => (
                      <Alert key={index} variant="destructive">
                        <div className="font-medium">{error.field || 'خطأ عام'}</div>
                        <div className="text-sm">{error.message}</div>
                        <div className="text-xs text-gray-600">Code: {error.code}</div>
                      </Alert>
                    ))}
                  </div>
                )}

                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-600">التحذيرات:</h4>
                    {validationResult.warnings.map((warning: string, index: number) => (
                      <Alert key={index} variant="warning">
                        {warning}
                      </Alert>
                    ))}
                  </div>
                )}

                {validationResult.metadata && (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <h4 className="font-semibold mb-2">Metadata:</h4>
                    <pre>{JSON.stringify(validationResult.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * مكون عرض إحصائيات الأخطاء
 */
export const ZodErrorAnalytics: React.FC = () => {
  const [errorStats, setErrorStats] = useState<any>(null);

  useEffect(() => {
    // Get error statistics
    const stats = errorHandler.getErrorStats();
    setErrorStats(stats);
  }, []);

  const refreshStats = () => {
    const stats = errorHandler.getErrorStats();
    setErrorStats(stats);
  };

  if (!errorStats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📊 Zod Validation Analytics
            </span>
            <Button onClick={refreshStats} variant="outline" size="sm">
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {errorStats.totalErrors}
              </div>
              <div className="text-sm text-blue-800">إجمالي الأخطاء</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {errorStats.errorsByLevel?.error || 0}
              </div>
              <div className="text-sm text-red-800">أخطاء حاسمة</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {errorStats.errorsByLevel?.warning || 0}
              </div>
              <div className="text-sm text-yellow-800">تحذيرات</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {errorStats.errorsByLevel?.info || 0}
              </div>
              <div className="text-sm text-green-800">معلومات</div>
            </div>
          </div>

          {errorStats.topErrors && errorStats.topErrors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">الأخطاء الأكثر تكراراً:</h4>
              <div className="space-y-2">
                {errorStats.topErrors.slice(0, 5).map((error: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm truncate flex-1">{error.message}</span>
                    <span className="text-sm font-medium bg-red-100 text-red-600 px-2 py-1 rounded">
                      {error.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * مكون رئيسي يجمع كل أدوات التطوير
 */
export const ZodDevelopmentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'validator' | 'tester' | 'analytics'>('validator');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Zod Development Tools</h1>
        <p className="text-gray-600">
          أدوات التطوير والتحقق من صحة البيانات باستخدام Zod
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('validator')}
            className={`px-4 py-2 rounded ${
              activeTab === 'validator' 
                ? 'bg-white shadow text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Schema Validator
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2 rounded ${
              activeTab === 'tester' 
                ? 'bg-white shadow text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Validation Tester
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded ${
              activeTab === 'analytics' 
                ? 'bg-white shadow text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Error Analytics
          </button>
        </div>
      </div>

      {activeTab === 'validator' && <ZodSchemaValidator />}
      {activeTab === 'tester' && <ZodValidationTester />}
      {activeTab === 'analytics' && <ZodErrorAnalytics />}
    </div>
  );
};

export default ZodDevelopmentTools;