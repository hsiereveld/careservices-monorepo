import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, FileText, Lock, Save, AlertCircle, CheckCircle, Camera, ToggleLeft, ToggleRight, Euro, Briefcase, FileCheck, CreditCard, Building, Trash2, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, ServiceProvider } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { v4 as uuidv4 } from 'uuid';

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { userRole } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'business'>('profile');
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    bio: '',
    avatar_url: '',
    instroom_completed: false
  });

  const [businessData, setBusinessData] = useState({
    business_name: '',
    description: '',
    hourly_rate: 0,
    bank_account_number: '',
    vat_number: '',
    company_registration_number: '',
    payment_terms: 'net30'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (userRole === 'professional') {
        fetchProviderData();
      }
    }
  }, [user, userRole]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          instroom_completed: data.instroom_completed || false
        });
        setAvatarUrl(data.avatar_url);
      } else {
        // Maak een nieuw profiel aan als het niet bestaat
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user!.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      }
    } catch (err: any) {
      setError('Fout bij het laden van profiel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderData = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProvider(data);
        setBusinessData({
          business_name: data.business_name || '',
          description: data.description || '',
          hourly_rate: data.hourly_rate || 0,
          bank_account_number: data.bank_account_number || '',
          vat_number: data.vat_number || '',
          company_registration_number: data.company_registration_number || '',
          payment_terms: data.payment_terms || 'net30'
        });
      }
    } catch (err: any) {
      console.error('Error fetching provider data:', err);
      // Don't set error here, as this is optional data
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Alleen afbeeldingen zijn toegestaan');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Afbeelding mag niet groter zijn dan 5MB');
      return;
    }
    
    setAvatarFile(file);
    setAvatarError('');
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
    
    // Clean up the object URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleAvatarUpload = async () => {
    if (!user || !avatarFile) return;
    
    setUploadingAvatar(true);
    setAvatarError('');
    
    try {
      // Create a unique file name
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setProfileData({
        ...profileData,
        avatar_url: publicUrl
      });
      
      setSuccess('Profielfoto succesvol bijgewerkt! 🎉');
      setAvatarFile(null);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setAvatarError('Fout bij het uploaden van profielfoto: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profileData.avatar_url) return;
    
    if (!confirm('Weet je zeker dat je je profielfoto wilt verwijderen?')) {
      return;
    }
    
    setUploadingAvatar(true);
    setAvatarError('');
    
    try {
      // Extract the file path from the URL
      const urlParts = profileData.avatar_url.split('/');
      const filePath = `${user.id}/${urlParts[urlParts.length - 1]}`;
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
        
      // Even if delete fails, still update the profile
      if (deleteError) {
        console.warn('Error deleting avatar file:', deleteError);
      }
      
      // Update the profile to remove the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setProfileData({
        ...profileData,
        avatar_url: ''
      });
      setAvatarUrl(null);
      
      setSuccess('Profielfoto succesvol verwijderd! 🎉');
    } catch (err: any) {
      setAvatarError('Fout bij het verwijderen van profielfoto: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          date_of_birth: profileData.date_of_birth,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          instroom_completed: profileData.instroom_completed
        });

      if (error) throw error;

      setSuccess('Profiel succesvol bijgewerkt! 🎉');
      fetchProfile();
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Check if provider exists
      if (provider) {
        // Update existing provider
        const { error } = await supabase
          .from('service_providers')
          .update({
            business_name: businessData.business_name,
            description: businessData.description,
            hourly_rate: businessData.hourly_rate,
            bank_account_number: businessData.bank_account_number,
            vat_number: businessData.vat_number,
            company_registration_number: businessData.company_registration_number,
            payment_terms: businessData.payment_terms
          })
          .eq('id', provider.id);

        if (error) throw error;
      } else {
        // Create new provider
        const { error } = await supabase
          .from('service_providers')
          .insert({
            user_id: user!.id,
            business_name: businessData.business_name,
            description: businessData.description,
            hourly_rate: businessData.hourly_rate,
            bank_account_number: businessData.bank_account_number,
            vat_number: businessData.vat_number,
            company_registration_number: businessData.company_registration_number,
            payment_terms: businessData.payment_terms,
            is_active: true,
            is_verified: false
          });

        if (error) throw error;
      }

      setSuccess('Bedrijfsgegevens succesvol bijgewerkt! 🎉');
      fetchProviderData();
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Nieuwe wachtwoorden komen niet overeen');
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Nieuw wachtwoord moet minimaal 6 karakters lang zijn');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setSuccess('Wachtwoord succesvol gewijzigd! 🔒');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError('Fout bij het wijzigen van wachtwoord: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img 
              src="/CS-logo-icon.png" 
              alt="Care & Service" 
              className="w-8 h-8 brightness-0 invert"
            />
          </div>
          <div className="text-text-primary text-xl font-medium">Profiel laden...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate href="/login" replace />;
  }

  const getInitials = () => {
    const firstName = profileData.first_name || '';
    const lastName = profileData.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getFullName = () => {
    const firstName = profileData.first_name || '';
    const lastName = profileData.last_name || '';
    return firstName && lastName ? `${firstName} ${lastName}` : user.email;
  };

  const isBusinessTabVisible = userRole === 'professional';

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <img 
                src="/CS-logo-icon.png" 
                alt="Care & Service Pinoso" 
                className="h-12 w-auto"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary">
                Jouw Profiel 👤
              </h1>
              <p className="text-text-secondary text-lg">
                Beheer je persoonlijke informatie en instellingen
              </p>
            </div>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-background-primary/80 backdrop-blur-sm rounded-3xl p-8 border border-primary-200/50 shadow-lg mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl}
                  alt={getFullName().toString()}
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-200"
                  onError={() => {
                    setAvatarUrl(null);
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials()}
                </div>
              )}
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 w-8 h-8 bg-background-primary rounded-full shadow-lg flex items-center justify-center text-text-secondary hover:text-primary-600 transition-colors cursor-pointer">
                <Camera className="w-4 h-4" />
              </label>
              <input 
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {getFullName()}
              </h2>
              <p className="text-text-secondary flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </p>
              {profileData.bio && (
                <p className="text-text-secondary mt-2 italic">"{profileData.bio}"</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-accent-50 border border-accent-200 rounded-2xl p-4 flex items-center space-x-3 mb-6">
            <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
            <span className="text-accent-700">{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-background-primary/80 backdrop-blur-sm rounded-3xl border border-primary-200/50 shadow-lg overflow-hidden">
          <div className="flex border-b border-primary-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="w-4 h-4" />
                <span>Persoonlijke Informatie</span>
              </div>
            </button>
            
            {isBusinessTabVisible && (
              <button
                onClick={() => setActiveTab('business')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'business'
                    ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                    : 'text-text-secondary hover:text-text-primary hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Bedrijfsgegevens</span>
                </div>
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'password'
                  ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Wachtwoord Wijzigen</span>
              </div>
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Profile Picture Section */}
                <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200 mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Profielfoto</h3>
                  
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <div className="relative">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl}
                          alt={getFullName().toString()}
                          className="w-32 h-32 rounded-full object-cover border-2 border-primary-200"
                          onError={() => {
                            setAvatarUrl(null);
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                          {getInitials()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <label htmlFor="avatar-upload-form" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center space-x-2">
                          <Camera className="w-4 h-4" />
                          <span>Foto kiezen</span>
                          <input 
                            type="file"
                            id="avatar-upload-form"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                        
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={handleAvatarUpload}
                            disabled={uploadingAvatar}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploaden...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Uploaden</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {profileData.avatar_url && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={uploadingAvatar}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Verwijderen</span>
                          </button>
                        )}
                      </div>
                      
                      {avatarFile && (
                        <p className="text-sm text-primary-600">
                          Geselecteerd: {avatarFile.name} ({Math.round(avatarFile.size / 1024)} KB)
                        </p>
                      )}
                      
                      {avatarError && (
                        <p className="text-sm text-red-600">{avatarError}</p>
                      )}
                      
                      <p className="text-sm text-text-secondary">
                        Upload een foto van jezelf. Maximaal 5MB, formaten: JPG, PNG, GIF.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Voornaam
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="Je voornaam"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Achternaam
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="Je achternaam"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Telefoonnummer
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="+31 6 12345678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Geboortedatum
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        value={profileData.date_of_birth}
                        onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-3">
                    Over jezelf
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 text-text-light absolute left-4 top-4" />
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none transition-all duration-300"
                      placeholder="Vertel iets over jezelf..."
                    />
                  </div>
                </div>

                {/* Professional Instroom Status */}
                {userRole === 'professional' && (
                  <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary mb-1">Professional Instroom doorlopen</h3>
                        <p className="text-sm text-text-secondary">
                          Geeft aan of je het Professional Instroom formulier hebt ingevuld
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileData({ ...profileData, instroom_completed: !profileData.instroom_completed })}
                        className="p-2 rounded-lg transition-colors"
                      >
                        {profileData.instroom_completed ? (
                          <ToggleRight className="w-10 h-10 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Opslaan...' : 'Profiel Opslaan'}</span>
                </button>
              </form>
            )}

            {activeTab === 'business' && isBusinessTabVisible && (
              <form onSubmit={handleBusinessSubmit} className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Bedrijfsgegevens voor Professionals</h3>
                  <p className="text-blue-700 text-sm">
                    Deze gegevens zijn nodig voor de financiële administratie en betalingen. 
                    Vul deze informatie zorgvuldig in.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Bedrijfsnaam
                    </label>
                    <div className="relative">
                      <Building className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessData.business_name || ''}
                        onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="Bedrijfsnaam of handelsnaam"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Uurtarief (€)
                    </label>
                    <div className="relative">
                      <Euro className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        value={businessData.hourly_rate || ''}
                        onChange={(e) => setBusinessData({ ...businessData, hourly_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-text-light mt-1">
                      Dit is het standaard uurtarief dat je ontvangt (inkooptarief voor Care & Service)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-3">
                    Bedrijfsomschrijving
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 text-text-light absolute left-4 top-4" />
                    <textarea
                      value={businessData.description || ''}
                      onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none transition-all duration-300"
                      placeholder="Beschrijf je bedrijf of dienstverlening..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Bankrekeningnummer (IBAN)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessData.bank_account_number || ''}
                        onChange={(e) => setBusinessData({ ...businessData, bank_account_number: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="NL00 BANK 0123 4567 89"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      BTW-nummer
                    </label>
                    <div className="relative">
                      <FileCheck className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessData.vat_number || ''}
                        onChange={(e) => setBusinessData({ ...businessData, vat_number: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="NL123456789B01"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      KVK-nummer
                    </label>
                    <div className="relative">
                      <Building className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessData.company_registration_number || ''}
                        onChange={(e) => setBusinessData({ ...businessData, company_registration_number: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="12345678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Betalingstermijn
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <select
                        value={businessData.payment_terms}
                        onChange={(e) => setBusinessData({ ...businessData, payment_terms: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="net15">15 dagen</option>
                        <option value="net30">30 dagen</option>
                        <option value="net45">45 dagen</option>
                        <option value="net60">60 dagen</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Belangrijk</h3>
                  <p className="text-yellow-700 text-sm">
                    Deze gegevens worden gebruikt voor het verwerken van betalingen. Zorg ervoor dat alle informatie correct is.
                    Als je een ZZP'er bent, vul dan je persoonlijke gegevens in. Als je een bedrijf hebt, vul dan je bedrijfsgegevens in.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Opslaan...' : 'Bedrijfsgegevens Opslaan'}</span>
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-6 h-6 text-primary-600" />
                    <div>
                      <h3 className="font-semibold text-primary-800">Wachtwoord Beveiliging</h3>
                      <p className="text-primary-600 text-sm">Kies een sterk wachtwoord om je account te beschermen</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-3">
                    Nieuw Wachtwoord
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-3">
                    Bevestig Nieuw Wachtwoord
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <Lock className="w-5 h-5" />
                  <span>{saving ? 'Wijzigen...' : 'Wachtwoord Wijzigen'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}