const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { referenteSchema } = require('./schemas/clienteSchema');
const ctrl = require('../controllers/referentesController');

router.get('/:clienteId/referentes',         ctrl.listar);
router.post('/:clienteId/referentes',        validate(referenteSchema), ctrl.crear);
router.put('/:clienteId/referentes/:id',     validate(referenteSchema), ctrl.actualizar);
router.delete('/:clienteId/referentes/:id',  ctrl.eliminar);

module.exports = router;
