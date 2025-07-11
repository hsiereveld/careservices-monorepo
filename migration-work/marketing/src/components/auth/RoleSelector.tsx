import React from 'react';

interface RoleSelectorProps {
  selectedRole: 'client' | 'professional' | null;
  onRoleSelect: (role: 'client' | 'professional') => void;
  disabled?: boolean;
}

export function RoleSelector({ selectedRole, onRoleSelect, disabled = false }: RoleSelectorProps) {
  const roles = [
    {
      id: 'client' as const,
      title: 'Ik zoek hulp',
      subtitle: 'Klant',
      description: 'Ik wil diensten boeken en hulp krijgen',
      color: 'from-primary-500 to-primary-600',
      features: [
        'Diensten boeken',
        'Betrouwbare professionals',
        'Geen zorgen of gedoe',
        'Zelf in controle'
      ]
    },
    {
      id: 'professional' as const,
      title: 'Ik bied hulp',
      subtitle: 'Professional',
      description: 'Ik wil diensten aanbieden en klanten helpen',
      color: 'from-accent-500 to-accent-600',
      features: [
        'Diensten aanbieden',
        'Eigen planning beheren',
        'Inkomsten genereren',
        'Klanten opbouwen'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Hoe wil je Care & Service gebruiken?
        </h3>
        <p className="text-text-secondary">
          Kies je rol om de juiste ervaring te krijgen
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          
          return (
            <button
              key={role.id}
              type="button"
              disabled={disabled}
              onClick={() => onRoleSelect(role.id)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-text-primary mb-1">
                    {role.title}
                  </h4>
                  <p className="text-sm text-primary-600 font-medium mb-2">
                    {role.subtitle}
                  </p>
                  <p className="text-text-secondary text-sm mb-3">
                    {role.description}
                  </p>
                  <ul className="space-y-1">
                    {role.features.map((feature, index) => (
                      <li key={index} className="text-xs text-text-light flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div>
            <p className="text-sm font-medium text-blue-800">
              Voor BackOffice medewerkers
            </p>
            <p className="text-xs text-blue-600">
              BackOffice accounts worden door administrators aangemaakt. 
              Neem contact op als je deel wilt uitmaken van ons team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}