const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { clienteSchema, clienteUpdateSchema } = require('./schemas/clienteSchema');
const ctrl = require('../controllers/clientesController');

router.get('/',        ctrl.listar);
router.get('/:id',     ctrl.obtener);
router.post('/',       validate(clienteSchema),       ctrl.crear);
router.put('/:id',     validate(clienteUpdateSchema), ctrl.actualizar);
router.delete('/:id',  ctrl.eliminar);

module.exports = router;
