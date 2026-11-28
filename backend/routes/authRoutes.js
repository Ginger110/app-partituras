const router = require('express').Router();
const authCtrl = require('../controllers/authCtrl');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/logout', authCtrl.logout);
router.get('/perfil', authMiddleware, authCtrl.perfil);

module.exports = router;
