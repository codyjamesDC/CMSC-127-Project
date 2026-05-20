import driverRoutes from './driverRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import registrationRoutes from './registrationRoutes.js';
import reportRoutes from './reportRoutes.js';

export default (app) => {
  // API Health Check Route
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'LTO API is running', timestamp: new Date() });
  });

  // 6.1 Remove Duplicate Route Registrations
  app.use('/api/drivers',       driverRoutes);
  app.use('/api/vehicles',      vehicleRoutes);
  app.use('/api/tickets',       ticketRoutes);
  app.use('/api/registrations', registrationRoutes);
  app.use('/api',       reportRoutes);
};