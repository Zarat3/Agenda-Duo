import React from 'react';

const MAP = {
  Confirmado:  'status-confirmado',
  Pendente:    'status-pendente',
  Cancelado:   'status-cancelado',
  Realizado:   'status-realizado',
};

export const StatusBadge = ({ status, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${MAP[status] ?? 'status-realizado'} ${className}`}>
    {status}
  </span>
);
