import React, { useState } from 'react';
import { Card, Button, Input, Loading } from '@/shared/components/ui';
import { Service, BookingFormData } from '@/shared/types';
import { formatCurrency } from '@/shared/utils';

interface BookingWidgetProps {
  service: Service;
  onSubmit: (data: BookingFormData) => Promise<void>;
  isLoading?: boolean;
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  service,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    service_id: service.id,
    booking_date: '',
    booking_time: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const today = new Date().toISOString().split('T')[0];
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  return (
    <Card className="max-w-md mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Reservar Servicio</h3>
        <p className="text-gray-600">{service.title}</p>
        <p className="text-blue-600 font-bold text-xl">{formatCurrency(service.price)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="date"
          label="Fecha"
          value={formData.booking_date}
          onChange={(e) => setFormData(prev => ({ ...prev, booking_date: e.target.value }))}
          min={today}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora
          </label>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, booking_time: time }))}
                className={`p-2 text-sm rounded-md border transition-colors ${
                  formData.booking_time === time
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Notas (opcional)"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Información adicional..."
        />

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={!formData.booking_date || !formData.booking_time}
        >
          {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
        </Button>
      </form>
    </Card>
  );
}; 