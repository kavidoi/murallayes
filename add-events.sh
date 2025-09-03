#!/bin/bash

echo "📅 Adding calendar events to Muralla system..."

# Get current dates for this week
TODAY=$(date +%Y-%m-%d)
WEDNESDAY=$(date -d "this wednesday" +%Y-%m-%d)
THURSDAY=$(date -d "this thursday" +%Y-%m-%d)

# Event 1: Instalación de Entel - Thursday 2pm
echo "Adding: Instalación de Entel"
curl -X POST http://localhost:4000/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MEETING",
    "title": "Instalación de Entel",
    "description": "Instalación del servicio de Entel en el local",
    "startTime": "'$THURSDAY'T14:00:00.000Z",
    "endTime": "'$THURSDAY'T16:00:00.000Z",
    "location": "Local Muralla Café",
    "priority": "HIGH",
    "status": "SCHEDULED",
    "color": "#DC2626"
  }'

echo -e "\n\nAdding: Junta con Pablo - Carteles"
# Event 2: Junta con Pablo - Wednesday 4pm  
curl -X POST http://localhost:4000/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MEETING", 
    "title": "Junta con Pablo - Carteles",
    "description": "Reunión con Pablo para revisar diseños de carteles y material promocional",
    "startTime": "'$WEDNESDAY'T16:00:00.000Z",
    "endTime": "'$WEDNESDAY'T17:00:00.000Z",
    "attendees": ["pablo@example.com"],
    "priority": "MEDIUM",
    "status": "SCHEDULED",
    "color": "#3B82F6"
  }'

echo -e "\n\nAdding: Reunión con Contadora"
# Event 3: Reunión con Contadora - Today 3pm
curl -X POST http://localhost:4000/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MEETING",
    "title": "Reunión con Contadora", 
    "description": "Reunión mensual con la contadora para revisar estados financieros y temas fiscales",
    "startTime": "'$TODAY'T15:00:00.000Z",
    "endTime": "'$TODAY'T16:30:00.000Z",
    "location": "Oficina Contadora / Video llamada",
    "priority": "HIGH", 
    "status": "SCHEDULED",
    "color": "#059669"
  }'

echo -e "\n\n🎉 Calendar events added successfully!"
echo "📋 Events scheduled:"
echo "• Instalación de Entel - $(date -d $THURSDAY +"%A, %B %d") at 2:00 PM"
echo "• Junta con Pablo - Carteles - $(date -d $WEDNESDAY +"%A, %B %d") at 4:00 PM"  
echo "• Reunión con Contadora - $(date -d $TODAY +"%A, %B %d") at 3:00 PM"
echo ""
echo "Visit http://localhost:5173/schedule/calendar to see your events!"