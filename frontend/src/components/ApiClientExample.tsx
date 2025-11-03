import React, { useState, useEffect } from 'react';
import { 
  leadsApi, 
  authApi, 
  messagesApi,
  playbooksApi,
  ApiErrorException,
  type Lead,
  type CreateLeadRequest
} from '../lib/api';

interface ApiClientExampleProps {}

const ApiClientExample: React.FC<ApiClientExampleProps> = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState<CreateLeadRequest>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual'
  });

  // جلب جميع العملاء
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await leadsApi.getAll({
        page: 1,
        limit: 10,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      
      setLeads(response.data.items);
    } catch (err) {
      console.error('خطأ في جلب العملاء:', err);
      
      if (err instanceof ApiErrorException) {
        setError(`خطأ ${err.status}: ${err.message}`);
      } else {
        setError('حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  // إنشاء عميل جديد
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await leadsApi.create(newLead);
      
      // إضافة العميل الجديد للقائمة
      setLeads(prev => [response.data, ...prev]);
      
      // إعادة تعيين النموذج
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'manual'
      });
      
      console.log('تم إنشاء العميل بنجاح:', response.data);
    } catch (err) {
      console.error('خطأ في إنشاء العميل:', err);
      
      if (err instanceof ApiErrorException) {
        setError(`خطأ ${err.status}: ${err.message}`);
      } else {
        setError('فشل في إنشاء العميل');
      }
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة العميل
  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      setError(null);
      
      const response = await leadsApi.updateStatus(leadId, newStatus);
      
      // تحديث العميل في القائمة
      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? response.data : lead
        )
      );
      
      console.log('تم تحديث حالة العميل:', response.data);
    } catch (err) {
      console.error('خطأ في تحديث حالة العميل:', err);
      
      if (err instanceof ApiErrorException) {
        setError(`خطأ ${err.status}: ${err.message}`);
      } else {
        setError('فشل في تحديث حالة العميل');
      }
    }
  };

  // حذف عميل
  const deleteLead = async (leadId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      return;
    }
    
    try {
      setError(null);
      
      await leadsApi.delete(leadId);
      
      // إزالة العميل من القائمة
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      
      console.log('تم حذف العميل بنجاح');
    } catch (err) {
      console.error('خطأ في حذف العميل:', err);
      
      if (err instanceof ApiErrorException) {
        setError(`خطأ ${err.status}: ${err.message}`);
      } else {
        setError('فشل في حذف العميل');
      }
    }
  };

  // تحميل البيانات عند بدء المكون
  useEffect(() => {
    fetchLeads();
  }, []);

  // تحديث المستخدم الحالي
  const handleGetCurrentUser = async () => {
    try {
      setError(null);
      
      const response = await authApi.getCurrentUser();
      console.log('المستخدم الحالي:', response.data);
      
      alert(`مرحباً ${response.data.first_name} ${response.data.last_name}`);
    } catch (err) {
      console.error('خطأ في جلب بيانات المستخدم:', err);
      
      if (err instanceof ApiErrorException) {
        setError(`خطأ ${err.status}: ${err.message}`);
      } else {
        setError('فشل في جلب بيانات المستخدم');
      }
    }
  };

  // تسجيل خروج
  const handleLogout = async () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) {
      return;
    }
    
    try {
      setError(null);
      
      await authApi.logout();
      console.log('تم تسجيل الخروج بنجاح');
      
      // إعادة تحميل الصفحة أو توجيه لصفحة تسجيل الدخول
      window.location.reload();
    } catch (err) {
      console.error('خطأ في تسجيل الخروج:', err);
      
      if (err instanceof ApiErrorException) {
        setError(`خطأ ${err.status}: ${err.message}`);
      } else {
        setError('فشل في تسجيل الخروج');
      }
    }
  };

  return (
    <div className="api-client-example">
      <h1>مثال عميل API</h1>
      
      {/* شريط الأدوات */}
      <div className="toolbar">
        <button 
          onClick={fetchLeads} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'جاري التحميل...' : 'تحديث العملاء'}
        </button>
        
        <button 
          onClick={handleGetCurrentUser}
          className="btn-secondary"
        >
          المستخدم الحالي
        </button>
        
        <button 
          onClick={handleLogout}
          className="btn-danger"
        >
          تسجيل الخروج
        </button>
      </div>

      {/* عرض الأخطاء */}
      {error && (
        <div className="error-message">
          <strong>خطأ:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="close-btn"
          >
            ×
          </button>
        </div>
      )}

      {/* نموذج إنشاء عميل جديد */}
      <div className="create-lead-form">
        <h2>إنشاء عميل جديد</h2>
        <form onSubmit={handleCreateLead}>
          <div className="form-row">
            <div className="form-group">
              <label>الاسم:</label>
              <input
                type="text"
                value={newLead.name}
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>البريد الإلكتروني:</label>
              <input
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                required
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>رقم الهاتف:</label>
              <input
                type="tel"
                value={newLead.phone}
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>الشركة:</label>
              <input
                type="text"
                value={newLead.company}
                onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                className="form-input"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-success"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء عميل'}
          </button>
        </form>
      </div>

      {/* قائمة العملاء */}
      <div className="leads-list">
        <h2>العملاء ({leads.length})</h2>
        
        {loading && leads.length === 0 ? (
          <div className="loading">جاري تحميل العملاء...</div>
        ) : leads.length === 0 ? (
          <div className="no-data">لا توجد عملاء</div>
        ) : (
          <div className="leads-grid">
            {leads.map((lead) => (
              <div key={lead.id} className="lead-card">
                <div className="lead-header">
                  <h3>{lead.name}</h3>
                  <span className={`status status-${lead.status}`}>
                    {lead.status}
                  </span>
                </div>
                
                <div className="lead-info">
                  <p><strong>البريد:</strong> {lead.email}</p>
                  {lead.phone && <p><strong>الهاتف:</strong> {lead.phone}</p>}
                  {lead.company && <p><strong>الشركة:</strong> {lead.company}</p>}
                  <p><strong>المصدر:</strong> {lead.source || 'غير محدد'}</p>
                  <p><strong>تاريخ الإنشاء:</strong> {new Date(lead.created_at).toLocaleDateString('ar-SA')}</p>
                </div>
                
                <div className="lead-actions">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                    className="status-select"
                  >
                    <option value="new">جديد</option>
                    <option value="contacted">تم التواصل</option>
                    <option value="qualified">مؤهل</option>
                    <option value="proposal">عرض سعر</option>
                    <option value="negotiation">تفاوض</option>
                    <option value="closed_won">مغلق - مكسب</option>
                    <option value="closed_lost">مغلق - خسارة</option>
                  </select>
                  
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="btn-danger btn-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiClientExample;