document.addEventListener('DOMContentLoaded', () => {
  const appointmentForm = document.getElementById('appointmentForm');
  const serviceSelect = document.getElementById('serviceSelect');
  const scheduleBuffer = document.getElementById('scheduleBuffer');
  const emptyState = document.getElementById('emptyState');
  const statusMessage = document.getElementById('statusMessage');

  // Initialization: Fetch UI requirements
  loadServices();
  loadAppointments();

  // Handle Form Submission
  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: document.getElementById('custName').value,
      phone: document.getElementById('custPhone').value,
      serviceId: serviceSelect.value,
      time: document.getElementById('appTime').value
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      displayStatus(data.message, 'success');
      appointmentForm.reset();
      loadAppointments(); // Refresh Dashboard view
    } catch (err) {
      displayStatus(err.message, 'error');
    }
  });

  // Fetch Services from API
  async function loadServices() {
    try {
      const res = await fetch('/api/services');
      const services = await res.json();
      
      serviceSelect.innerHTML = services.map(s => `
        <option value="${s.id}">${s.name} ($${s.price})</option>
      `).join('');
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  // Fetch and display dashboard appointments
  async function loadAppointments() {
    try {
      const res = await fetch('/api/appointments');
      const apps = await res.json();

      if (apps.length === 0) {
        scheduleBuffer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');
      
      // Sort upcoming appointments sequentially by datetime string
      apps.sort((a, b) => new Date(a.time) - new Date(b.time));

      scheduleBuffer.innerHTML = apps.map(a => {
        const formattedDate = new Date(a.time).toLocaleString([], {
          dateStyle: 'short',
          timeStyle: 'short'
        });

        return `
          <tr class="hover:bg-slate-50/70 transition">
            <td class="py-3.5 font-medium text-slate-900">${formattedDate}</td>
            <td class="py-3.5 text-slate-600">${a.customerName} <span class="text-xs text-slate-400 block">${a.customerPhone}</span></td>
            <td class="py-3.5"><span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold">${a.serviceName}</span></td>
            <td class="py-3.5 text-slate-900 font-semibold">$${a.price}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  }

  // UI Status helper
  function displayStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.classList.remove('hidden', 'bg-green-50', 'text-green-700', 'bg-red-50', 'text-red-700');
    
    if (type === 'success') {
      statusMessage.classList.add('bg-green-50', 'text-green-700');
    } else {
      statusMessage.classList.add('bg-red-50', 'text-red-700');
    }

    setTimeout(() => statusMessage.classList.add('hidden'), 5000);
  }
});
