import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import * as vehiclesController from './vehicles.controller';

const router = Router();

// Tất cả endpoints đều cần đăng nhập
router.use(authenticate);

router.get('/', vehiclesController.getMyVehicles);
router.get('/:id', vehiclesController.getVehicleById);
router.post('/', vehiclesController.createVehicle);
router.patch('/:id', vehiclesController.updateVehicle);
router.delete('/:id', vehiclesController.deleteVehicle);

export default router;
