import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Tag,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  User,
  Euro,
  Hash,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { supabase, Discount, DiscountType } from '../../lib/supabase';

export function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingDiscountType, setEditingDiscountType] = useState<DiscountType | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [typeFormMode, setTypeFormMode] = useState<'create' | 'edit'>('create');
  
  const [discountFormData, setDiscountFormData] = useState<Partial<Discount>>({
    discount_type_id: '',
    code: '',
    description: '',
    amount: null,
    percentage: null,
    is_percentage: true,
    min_order_amount: 0,
    max_uses: null,
    uses_count: 0,
    start_date: null,
    end_date: null,
    is_active: true,
    user_id: null
  });
  
  const [typeFormData, setTypeFormData] = useState<Partial<DiscountType>>({
    name: '',
    description: '',
    discount_percentage: 0,
    is_active: true
  });

  useEffect(() => {
    fetchDiscountData();
  }, []);

  const fetchDiscountData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch discount types
      const { data: typesData, error: typesError } = await supabase
        .from('discount_types')
        .select('*')
        .order('name');

      if (typesError) throw typesError;

      setDiscountTypes(typesData || []);

      // Fetch discounts with their types
      const { data: discountsData, error: discountsError } = await supabase
        .from('discounts')
        .select(`
          *,
          discount_type:discount_types(*)
        `)
        .order('created_at', { ascending: false });

      if (discountsError) throw discountsError;

      setDiscounts(discountsData || []);
    } catch (err: any) {
      setError('Fout bij het laden van kortingsgegevens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDiscountForm = (mode: 'create' | 'edit' | 'view', discount?: Discount) => {
    setFormMode(mode);
    setEditingDiscount(discount || null);
    
    if (discount) {
      setDiscountFormData({
        discount_type_id: discount.discount_type_id || '',
        code: discount.code || '',
        description: discount.description || '',
        amount: discount.amount,
        percentage: discount.percentage,
        is_percentage: discount.is_percentage,
        min_order_amount: discount.min_order_amount || 0,
        max_uses: discount.max_uses,
        uses_count: discount.uses_count || 0,
        start_date: discount.start_date,
        end_date: discount.end_date,
        is_active: discount.is_active,
        user_id: discount.user_id
      });
    } else {
      // Generate a random discount code
      const randomCode = 'CS' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      setDiscountFormData({
        discount_type_id: '',
        code: randomCode,
        description: '',
        amount: null,
        percentage: 10, // Default 10% discount
        is_percentage: true,
        min_order_amount: 0,
        max_uses: null,
        uses_count: 0,
        start_date: null,
        end_date: null,
        is_active: true,
        user_id: null
      });
    }
    
    setShowForm(true);
  };

  const openDiscountTypeForm = (mode: 'create' | 'edit', discountType?: DiscountType) => {
    setTypeFormMode(mode);
    setEditingDiscountType(discountType || null);
    
    if (discountType) {
      setTypeFormData({
        name: discountType.name,
        description: discountType.description || '',
        discount_percentage: discountType.discount_percentage,
        is_active: discountType.is_active
      });
    } else {
      setTypeFormData({
        name: '',
        description: '',
        discount_percentage: 0,
        is_active: true
      });
    }
    
    setShowTypeForm(true);
  };

  const closeDiscountForm = () => {
    setShowForm(false);
    setEditingDiscount(null);
  };

  const closeDiscountTypeForm = () => {
    setShowTypeForm(false);
    setEditingDiscountType(null);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') return;

    setError('');
    setSuccess('');

    try {
      // Validate form data
      if (discountFormData.is_percentage && (discountFormData.percentage === null || discountFormData.percentage === undefined)) {
        throw new Error('Vul een geldig percentage in');
      }
      
      if (!discountFormData.is_percentage && (discountFormData.amount === null || discountFormData.amount === undefined)) {
        throw new Error('Vul een geldig bedrag in');
      }
      
      if (!discountFormData.code) {
        throw new Error('Vul een kortingscode in');
      }

      if (formMode === 'create') {
        // Check if code already exists
        const { data: existingCode, error: codeError } = await supabase
          .from('discounts')
          .select('id')
          .eq('code', discountFormData.code)
          .maybeSingle();

        if (codeError) throw codeError;
        
        if (existingCode) {
          throw new Error('Deze kortingscode bestaat al. Kies een andere code.');
        }

        const { error: createError } = await supabase
          .from('discounts')
          .insert([discountFormData]);

        if (createError) throw createError;
        setSuccess('Kortingscode succesvol aangemaakt! 🎉');
      } else {
        // Check if code already exists (but not this one)
        if (discountFormData.code !== editingDiscount?.code) {
          const { data: existingCode, error: codeError } = await supabase
            .from('discounts')
            .select('id')
            .eq('code', discountFormData.code)
            .maybeSingle();

          if (codeError) throw codeError;
          
          if (existingCode) {
            throw new Error('Deze kortingscode bestaat al. Kies een andere code.');
          }
        }

        const { error: updateError } = await supabase
          .from('discounts')
          .update(discountFormData)
          .eq('id', editingDiscount!.id);

        if (updateError) throw updateError;
        setSuccess('Kortingscode succesvol bijgewerkt! 🎉');
      }

      fetchDiscountData();
      setTimeout(() => {
        closeDiscountForm();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    }
  };

  const handleDiscountTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    try {
      if (typeFormMode === 'create') {
        const { error: createError } = await supabase
          .from('discount_types')
          .insert([typeFormData]);

        if (createError) throw createError;
        setSuccess('Kortingstype succesvol aangemaakt! 🎉');
      } else {
        const { error: updateError } = await supabase
          .from('discount_types')
          .update(typeFormData)
          .eq('id', editingDiscountType!.id);

        if (updateError) throw updateError;
        setSuccess('Kortingstype succesvol bijgewerkt! 🎉');
      }

      fetchDiscountData();
      setTimeout(() => {
        closeDiscountTypeForm();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    }
  };

  const toggleDiscountStatus = async (discountId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('discounts')
        .update({ is_active: !currentStatus })
        .eq('id', discountId);

      if (error) throw error;

      setSuccess(`Kortingscode ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}! 🎉`);
      fetchDiscountData();
    } catch (err: any) {
      setError('Fout bij het wijzigen van status: ' + err.message);
    }
  };

  const toggleDiscountTypeStatus = async (typeId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('discount_types')
        .update({ is_active: !currentStatus })
        .eq('id', typeId);

      if (error) throw error;

      setSuccess(`Kortingstype ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}! 🎉`);
      fetchDiscountData();
    } catch (err: any) {
      setError('Fout bij het wijzigen van status: ' + err.message);
    }
  };

  const deleteDiscount = async (discountId: string, discountCode: string) => {
    if (!confirm(`Weet je zeker dat je kortingscode "${discountCode}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      // Check if discount has been used
      const { data: discount, error: fetchError } = await supabase
        .from('discounts')
        .select('uses_count')
        .eq('id', discountId)
        .single();

      if (fetchError) throw fetchError;
      
      if (discount && discount.uses_count > 0) {
        if (!confirm(`Deze kortingscode is al ${discount.uses_count} keer gebruikt. Weet je zeker dat je deze wilt verwijderen?`)) {
          return;
        }
      }

      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      setSuccess(`Kortingscode "${discountCode}" succesvol verwijderd! 🗑️`);
      fetchDiscountData();
    } catch (err: any) {
      setError('Fout bij het verwijderen van kortingscode: ' + err.message);
    }
  };

  const deleteDiscountType = async (typeId: string, typeName: string) => {
    if (!confirm(`Weet je zeker dat je kortingstype "${typeName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      // Check if type is used by any discounts
      const { data: usedDiscounts, error: checkError } = await supabase
        .from('discounts')
        .select('id')
        .eq('discount_type_id', typeId);

      if (checkError) throw checkError;
      
      if (usedDiscounts && usedDiscounts.length > 0) {
        throw new Error(`Dit kortingstype kan niet worden verwijderd omdat het wordt gebruikt door ${usedDiscounts.length} kortingscodes.`);
      }

      const { error } = await supabase
        .from('discount_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      setSuccess(`Kortingstype "${typeName}" succesvol verwijderd! 🗑️`);
      fetchDiscountData();
    } catch (err: any) {
      setError('Fout bij het verwijderen van kortingstype: ' + err.message);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const randomCode = 'CS' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setDiscountFormData({ ...discountFormData, code: randomCode });
  };

  // Filter discounts based on search and type
  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = 
      (discount.code?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      discount.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (discount.discount_type?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = selectedType === 'all' || discount.discount_type_id === selectedType;
    
    return matchesSearch && matchesType;
  });

  const isReadOnly = formMode === 'view';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Kortingsbeheer</h2>
          <p className="text-gray-600">Beheer alle kortingscodes en kortingstypes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openDiscountTypeForm('create')}
            className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw Type</span>
          </button>
          <button
            onClick={() => openDiscountForm('create')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe Korting</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Discount Types Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Kortingstypes</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discountTypes.length > 0 ? (
                discountTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{type.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-600">{type.discount_percentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {type.is_active ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openDiscountTypeForm('edit', type)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleDiscountTypeStatus(type.id, type.is_active)}
                          className={`${
                            type.is_active ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          {type.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => deleteDiscountType(type.id, type.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Geen kortingstypes gevonden. Maak een nieuw type aan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zoek kortingscodes..."
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Alle types</option>
            {discountTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waarde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geldigheid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900">{discount.code}</div>
                        <button 
                          onClick={() => discount.code && handleCopyCode(discount.code)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedCode === discount.code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{discount.discount_type?.name || 'Geen type'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{discount.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {discount.is_percentage ? (
                        <div className="text-sm font-medium text-primary-600">{discount.percentage}%</div>
                      ) : (
                        <div className="text-sm font-medium text-primary-600">€{discount.amount?.toFixed(2)}</div>
                      )}
                      {discount.min_order_amount > 0 && (
                        <div className="text-xs text-gray-500">Min. €{discount.min_order_amount.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {discount.start_date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Vanaf: {new Date(discount.start_date).toLocaleDateString('nl-NL')}</span>
                          </div>
                        )}
                        {discount.end_date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Tot: {new Date(discount.end_date).toLocaleDateString('nl-NL')}</span>
                          </div>
                        )}
                        {!discount.start_date && !discount.end_date && (
                          <span>Geen beperking</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {discount.max_uses ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{discount.uses_count}/{discount.max_uses}</span>
                          </div>
                        ) : (
                          <span>Onbeperkt</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {discount.is_active ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openDiscountForm('view', discount)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDiscountForm('edit', discount)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleDiscountStatus(discount.id, discount.is_active)}
                          className={`${
                            discount.is_active ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          {discount.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => deleteDiscount(discount.id, discount.code || 'deze korting')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Geen kortingscodes gevonden. Maak een nieuwe kortingscode aan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Percent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formMode === 'create' && 'Nieuwe Kortingscode'}
                      {formMode === 'edit' && 'Kortingscode Bewerken'}
                      {formMode === 'view' && 'Kortingscode Bekijken'}
                    </h2>
                    <p className="text-gray-600">
                      {formMode === 'create' && 'Voeg een nieuwe kortingscode toe'}
                      {formMode === 'edit' && 'Wijzig de kortingscode eigenschappen'}
                      {formMode === 'view' && 'Bekijk alle kortingscode informatie'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDiscountForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleDiscountSubmit} className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Kortingscode *
                      </label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            disabled={isReadOnly}
                            value={discountFormData.code || ''}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, code: e.target.value.toUpperCase() })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                            placeholder="ZOMER2025"
                          />
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={generateRandomCode}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Genereer
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Kortingstype
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={discountFormData.discount_type_id || ''}
                        onChange={(e) => setDiscountFormData({ ...discountFormData, discount_type_id: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      >
                        <option value="">Geen type (aangepaste korting)</option>
                        {discountTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.discount_percentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Beschrijving *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={discountFormData.description || ''}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      placeholder="Bijvoorbeeld: Zomerkorting 2025"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Kortingstype
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            disabled={isReadOnly}
                            checked={discountFormData.is_percentage}
                            onChange={() => setDiscountFormData({ ...discountFormData, is_percentage: true })}
                            className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                          />
                          <span className="ml-2">Percentage</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            disabled={isReadOnly}
                            checked={!discountFormData.is_percentage}
                            onChange={() => setDiscountFormData({ ...discountFormData, is_percentage: false })}
                            className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                          />
                          <span className="ml-2">Vast bedrag</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      {discountFormData.is_percentage ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Percentage (%) *
                          </label>
                          <div className="relative">
                            <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                              type="number"
                              step="0.01"
                              required
                              disabled={isReadOnly}
                              value={discountFormData.percentage || ''}
                              onChange={(e) => setDiscountFormData({ ...discountFormData, percentage: parseFloat(e.target.value) || 0 })}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                              placeholder="10.00"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Bedrag (€) *
                          </label>
                          <div className="relative">
                            <Euro className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                              type="number"
                              step="0.01"
                              required
                              disabled={isReadOnly}
                              value={discountFormData.amount || ''}
                              onChange={(e) => setDiscountFormData({ ...discountFormData, amount: parseFloat(e.target.value) || 0 })}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                              placeholder="5.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Minimaal orderbedrag (€)
                    </label>
                    <div className="relative">
                      <Euro className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={discountFormData.min_order_amount || 0}
                        onChange={(e) => setDiscountFormData({ ...discountFormData, min_order_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimumbedrag waarop deze korting van toepassing is. 0 voor geen minimum.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Startdatum
                      </label>
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={discountFormData.start_date ? new Date(discountFormData.start_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => setDiscountFormData({ ...discountFormData, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Einddatum
                      </label>
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={discountFormData.end_date ? new Date(discountFormData.end_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => setDiscountFormData({ ...discountFormData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Maximaal aantal gebruiken
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={discountFormData.max_uses === null ? '' : discountFormData.max_uses}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, max_uses: e.target.value === '' ? null : parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      placeholder="Onbeperkt"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Laat leeg voor onbeperkt gebruik
                    </p>
                  </div>

                  {formMode === 'edit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Aantal keer gebruikt
                      </label>
                      <input
                        type="number"
                        disabled={true}
                        value={discountFormData.uses_count || 0}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setDiscountFormData({ ...discountFormData, is_active: !discountFormData.is_active })}
                      className={`p-2 rounded-lg transition-colors ${
                        discountFormData.is_active 
                          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                          : 'text-red-600 bg-red-50 hover:bg-red-100'
                      } disabled:opacity-60`}
                    >
                      {discountFormData.is_active ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      Kortingscode is {discountFormData.is_active ? 'actief' : 'inactief'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isReadOnly && (
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>
                        {formMode === 'create' ? 'Kortingscode Aanmaken' : 'Wijzigingen Opslaan'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={closeDiscountForm}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md font-medium transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                )}

                {isReadOnly && (
                  <div className="flex justify-end pt-6">
                    <button
                      type="button"
                      onClick={closeDiscountForm}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
                    >
                      Sluiten
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Discount Type Form Modal */}
      {showTypeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {typeFormMode === 'create' ? 'Nieuw Kortingstype' : 'Kortingstype Bewerken'}
                    </h2>
                    <p className="text-gray-600">
                      {typeFormMode === 'create' ? 'Voeg een nieuw kortingstype toe' : 'Wijzig het kortingstype'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDiscountTypeForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleDiscountTypeSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Naam *
                  </label>
                  <input
                    type="text"
                    required
                    value={typeFormData.name || ''}
                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijvoorbeeld: Seniorenkorting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Beschrijving
                  </label>
                  <textarea
                    value={typeFormData.description || ''}
                    onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                    placeholder="Beschrijving van het kortingstype..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Kortingspercentage (%) *
                  </label>
                  <div className="relative">
                    <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={typeFormData.discount_percentage || ''}
                      onChange={(e) => setTypeFormData({ ...typeFormData, discount_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="10.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setTypeFormData({ ...typeFormData, is_active: !typeFormData.is_active })}
                    className={`p-2 rounded-lg transition-colors ${
                      typeFormData.is_active 
                        ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                        : 'text-red-600 bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    {typeFormData.is_active ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-900">
                    Kortingstype is {typeFormData.is_active ? 'actief' : 'inactief'}
                  </span>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>
                      {typeFormMode === 'create' ? 'Type Aanmaken' : 'Wijzigingen Opslaan'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={closeDiscountTypeForm}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md font-medium transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}