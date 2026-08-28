export const overviewMock = {
  summary: [
    { label: 'Tareas', value: '8', detail: '3 para hoy' },
    { label: 'Eventos', value: '4', detail: '2 en las próximas 24 h' },
    { label: 'Seguimientos', value: '6', detail: '2 necesitan respuesta' },
    { label: 'Clientes activos', value: '24', detail: '5 nuevos este mes' }
  ],
  attention: [
    {
      title: 'Juan García',
      subtitle: 'Seguimiento pendiente desde hace 3 días',
      icon: 'clock' as const
    },
    { title: 'Presupuesto de María', subtitle: 'Vence hoy', icon: 'alertCircle' as const }
  ],
  upcoming: [
    { time: '10:30', title: 'Reunión con María' },
    { time: '12:00', title: 'Llamar a Juan' },
    { time: '16:00', title: 'Preparar propuesta' }
  ],
  tasks: [
    { title: 'Enviar propuesta a María', when: 'Hoy, 16:00', priority: 'Alta' },
    { title: 'Revisar notas de la reunión', when: 'Hoy, 17:30', priority: '' },
    { title: 'Actualizar ficha de Juan', when: 'Mañana', priority: 'Media' }
  ],
  activity: [
    { person: 'Alex', action: 'creó un cliente', subject: 'Estudio Norte', time: 'Hace 12 min' },
    {
      person: 'María',
      action: 'completó una tarea',
      subject: 'Enviar contrato',
      time: 'Hace 45 min'
    },
    {
      person: 'Alex',
      action: 'creó una reunión',
      subject: 'Revisión de propuesta',
      time: 'Ayer, 16:20'
    },
    {
      person: 'Sofía',
      action: 'actualizó un cliente',
      subject: 'Lumen Studio',
      time: 'Ayer, 14:05'
    }
  ],
  kanban: [
    { label: 'Por hacer', count: 6, tone: 'bg-muted-foreground/40' },
    { label: 'En curso', count: 3, tone: 'bg-blue-500' },
    { label: 'Esperando', count: 2, tone: 'bg-amber-500' },
    { label: 'Hecho', count: 12, tone: 'bg-emerald-500' }
  ],
  customers: [
    { initials: 'EG', name: 'Estudio Gris', type: 'Agencia', activity: 'Propuesta enviada' },
    { initials: 'LM', name: 'Lumen Studio', type: 'Consultoría', activity: 'Cliente actualizado' },
    { initials: 'SN', name: 'Servicios Norte', type: 'Empresa', activity: 'Reunión creada' }
  ]
} as const;
