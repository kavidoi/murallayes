const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000';

// Get current week dates for the events
const today = new Date();
const currentWeek = new Date(today);

// Find Wednesday and Thursday of this week
const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const wednesday = new Date(currentWeek);
wednesday.setDate(today.getDate() - dayOfWeek + 3); // Wednesday
const thursday = new Date(currentWeek);  
thursday.setDate(today.getDate() - dayOfWeek + 4); // Thursday

const events = [
  {
    type: 'MEETING',
    title: 'Instalación de Entel',
    description: 'Instalación del servicio de Entel en el local',
    startTime: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 14, 0), // Thursday 2pm
    endTime: new Date(thursday.getFullYear(), thursday.getMonth(), thursday.getDate(), 16, 0), // 2 hour duration
    priority: 'HIGH',
    status: 'SCHEDULED',
    color: '#DC2626',
    location: 'Local Muralla Café'
  },
  {
    type: 'MEETING',
    title: 'Junta con Pablo - Carteles',
    description: 'Reunión con Pablo para revisar diseños de carteles y material promocional',
    startTime: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 16, 0), // Wednesday 4pm
    endTime: new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 17, 0), // 1 hour duration
    priority: 'MEDIUM',
    status: 'SCHEDULED',
    color: '#3B82F6',
    attendees: ['pablo@example.com']
  },
  {
    type: 'MEETING',
    title: 'Reunión con Contadora',
    description: 'Reunión mensual con la contadora para revisar estados financieros y temas fiscales',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0), // Today 3pm
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30), // 1.5 hour duration
    priority: 'HIGH',
    status: 'SCHEDULED',
    color: '#059669',
    location: 'Oficina Contadora / Video llamada'
  }
];

async function addCalendarEvents() {
  console.log('📅 Adding calendar events to Muralla system...\n');

  for (const event of events) {
    try {
      console.log(`Adding: ${event.title} - ${event.startTime.toLocaleString('es-CL')}`);
      
      const response = await axios.post(`${API_BASE_URL}/calendar/events`, event, {
        headers: {
          'Content-Type': 'application/json',
          // Note: You'll need to add proper authentication headers if required
          // 'Authorization': 'Bearer your-jwt-token-here'
        }
      });

      console.log(`✅ Added successfully: ${event.title}`);
    } catch (error) {
      console.error(`❌ Error adding ${event.title}:`, error.response?.data || error.message);
    }
  }

  console.log('\n🎉 Calendar events processing completed!');
  console.log('\n📋 Events added:');
  events.forEach(event => {
    console.log(`• ${event.title} - ${event.startTime.toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
  });
}

// Run the script
addCalendarEvents().catch(console.error);