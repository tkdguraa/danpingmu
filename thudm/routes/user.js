var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});
router.get('/login',function(req,res,next){
    console.log("asd");
    res.render('login');
})
router.get('/signup',function(req,res,next){
    console.log("asd");
    res.render('signup');
})

module.exports = router;
