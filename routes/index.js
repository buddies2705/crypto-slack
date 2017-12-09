var express = require('express');
var rest = require('restler');
var router = express.Router();


/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });



router.post('/', function(req, res) {
    console.log(req.body)
    getPrice(req.body.text , function (err , data){
      console.log("test" + data); 
      res.send(createSuccessResponse(data));      
    });
});

function createSuccessResponse(data){
  var res = { 
    "text": "*BTC =* " + data.BTC  + " *EUR =* " + data.EUR + " *USD =* "+ data.USD,
    "username": "coinprice",
    "mrkdwn": true
  }
return res;
}






function getPrice(coin,callback){
var api = "price";
var fsym = "fsym";
  if (coin.indexOf(',') > -1){
    api ="pricemulti"
    fsym = "fsyms"
  }
url = 'https://min-api.cryptocompare.com/data/'+api+'?'+fsym+'='+coin+'&tsyms=BTC,USD,EUR'
console.log(url)
  rest.get(url).on('complete', function(data) {   
    console.log(data); // auto convert to object
    callback(null ,data) 
  });
}

module.exports = router;






