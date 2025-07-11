import React, { useState } from 'react';
import { Card, Button, Input } from '@/shared/components/ui';
import { User, ProfileFormData } from '@/shared/types';

interface UserProfileProps {
  user: User;
  onUpdate: (data: ProfileFormData) => Promise<void>;
  isLoading?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdate,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name,
    email: user.email,
    phone: user.phone || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || '/default-avatar.png'}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
              {user.role}
            </span>
          </div>
        </div>
        
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Editar Perfil
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={isLoading}>
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}; 