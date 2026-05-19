const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { upload } = require('../middlewares/upload');
const { proyectoSchema, proyectoUpdateSchema } = require('./schemas/proyectoSchema');
const ctrl = require('../controllers/proyectosController');

router.get('/',                              ctrl.listar);
router.get('/:id',                           ctrl.obtener);
router.post('/',                             validate(proyectoSchema),       ctrl.crear);
router.put('/:id',                           validate(proyectoUpdateSchema), ctrl.actualizar);
router.delete('/:id',                        ctrl.eliminar);

// Archivos adjuntos
router.post('/:proyectoId/archivos',
  upload.single('archivo'),
  ctrl.subirArchivo
);
router.delete('/:proyectoId/archivos/:archivoId', ctrl.eliminarArchivo);

module.exports = router;
