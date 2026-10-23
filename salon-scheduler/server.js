const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Data Store (Easily swappable with PostgreSQL/MongoDB)
const services = [
  { id: 1, name: 'Haircut & Styling', duration: 45, price: 40 },
  { id: 2, name: 'Manicure & Pedicure', duration: 60, price: 55 },
  { id: 3, name: 'Facial & Skincare Treatment', duration: 60, price: 75 },
  { id: 4, name: 'Hair Coloring', duration: 120, price: 110 }
];

let appointments = [];
let customers = [];

// Helper: Find or create customer
function getOrCreateCustomer(name, phone) {
  let customer = customers.find(c => c.phone === phone);
  if (!customer) {
    customer = { id: customers.length + 1, name, phone };
    customers.push(customer);
  }
  return customer;
}

// --- API Endpoints ---

// Get available salon services
app.get('/api/services', (req, res) => {
  res.json(services);
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
  // Hydrate appointments with customer and service details
  const detailedAppointments = appointments.map(app => {
    const customer = customers.find(c => c.id === app.customerId);
    const service = services.find(s => s.id === app.serviceId);
    return {
      id: app.id,
      time: app.time,
      customerName: customer ? customer.name : 'Unknown',
      customerPhone: customer ? customer.phone : '',
      serviceName: service ? service.name : 'Unknown',
      price: service ? service.price : 0
    };
  });
  res.json(detailedAppointments);
});

// Create a new appointment
app.post('/api/appointments', (req, res) => {
  const { name, phone, serviceId, time } = req.body;

  // Validation
  if (!name || !phone || !serviceId || !time) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const service = services.find(s => s.id === parseInt(serviceId));
  if (!service) {
    return res.status(400).json({ error: 'Invalid service selected.' });
  }

  // Prevent duplicate timeslots
  const timeConflict = appointments.some(app => app.time === time);
  if (timeConflict) {
    return res.status(400).json({ error: 'This time slot is already booked.' });
  }

  const customer = getOrCreateCustomer(name, phone);

  const newAppointment = {
    id: appointments.length + 1,
    customerId: customer.id,
    serviceId: service.id,
    time: time
  };

  appointments.push(newAppointment);
  
  res.status(201).json({ 
    message: 'Appointment successfully scheduled!', 
    appointment: {
      id: newAppointment.id,
      customerName: customer.name,
      serviceName: service.name,
      time: newAppointment.time
    }
  });
});

// Catch-all to serve index.html
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Salon Server running on http://localhost:${PORT}`);
});
