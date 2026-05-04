import driverRoutes from './driverRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import ticketRoutes from './ticketRoutes.js';


export default (app) => {
    app.use('/api/drivers', driverRoutes);
    app.use('/api/vehicles', vehicleRoutes);
    app.use('/api/tickets', ticketRoutes);
}