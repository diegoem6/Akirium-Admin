const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { colaboradorSchema, colaboradorUpdateSchema, sueldoSchema } = require('./schemas/colaboradorSchema');
const ctrl = require('../controllers/colaboradoresController');

router.get('/',                        ctrl.listar);
router.get('/:id',                     ctrl.obtener);
router.post('/',                       validate(colaboradorSchema),       ctrl.crear);
router.put('/:id',                     validate(colaboradorUpdateSchema), ctrl.actualizar);
router.delete('/:id',                  ctrl.eliminar);

// Historial de sueldos
router.get('/:id/sueldos',             ctrl.historialSueldos);
router.post('/:id/sueldos',            validate(sueldoSchema), ctrl.registrarSueldo);

module.exports = router;
