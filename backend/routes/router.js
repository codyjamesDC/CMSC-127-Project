import driverRoutes from './driverRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import registrationRoutes from './registrationRoutes.js';
import reportRoutes from './reportRoutes.js';


export default (app) => {
    app.use('/api/drivers', driverRoutes);
    app.use('/api/drivers/drivers', driverRoutes);
    app.use('/api/vehicles', vehicleRoutes);
    app.use('/api/vehicles/vehicles', vehicleRoutes);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/tickets/tickets', ticketRoutes);
    app.use('/api/registrations', registrationRoutes);
    app.use('/api/registrations/registrations', registrationRoutes);
    app.use('/api', reportRoutes);
}