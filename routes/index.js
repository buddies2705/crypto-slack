

var express = require('express');
var rest = require('restler');
var router = express.Router();


var eventMap = {};

router.post('/', function(req, res) {
  var coinName = req.body.text;
    aggregateDataLast24Hours(coinName , function (err , data){
      res.send(createSuccessResponseForLast24Data(data.Data ,coinName));      
    });
});

router.post('/message', function(req, res) {
  console.log(req);
  if(req.body.challenge != undefined){
    res.send(req.body.challenge)
  }
   var coinName = getCoin(req.body.event.text);
   if(coinName != "nocoin"){
     if(!checkDoubleSend(coinName ,req.body.event_id )){
       return;
     }
   aggregateDataLast24Hours(coinName , function (err , data){
  postToWebhook(data , coinName);
  });
}
});


function checkDoubleSend(coinName , eventId){
  if(eventMap[coinName] == undefined){
    eventMap[coinName]=eventId;
    return true;
  }
  if(eventMap[coinName] == eventId){
    return false;
  }
  eventMap[coinName]= eventId;
  return true;
}

function postToWebhook(data , coinName){
  rest.post('https://hooks.slack.com/services/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', {
    data: JSON.stringify(createSuccessResponseForLast24Data(data.Data ,coinName))
  }).on('complete', function(data, response) {
    // console.log(response);
  });
}


function getCoin(text){
  if(text.substring(0,3)=="?p "){
    return text.substr(text.indexOf(" ")+1, text.length - 1);
  }
  return "nocoin";
}


function createSuccessResponse(data ){
  var res = { 
    "text": "*BTC =* " + data.BTC  + " *EUR =* " + data.EUR + " *USD =* "+ data.USD,
    "username": "coinprice",
    "mrkdwn": true
  }
return res;
}


function createSuccessResponseForLast24Data(data, coinName){
var lastDayValue = calculatePriceChange(data,1460); 
var lastHourValue = calculatePriceChange(data,60); 
var currentValue =  data[data.length - 1].close;
  var res = { 
    "text": "*"+coinName.toUpperCase()+"*" +" - " +"*"+currentValue+"*"  + " *$*" +"\n *24H* = " 
    + lastDayValue + "% " + getEmoji(lastDayValue)+ "\n *1H* = " + lastHourValue + "% " + getEmoji(lastHourValue),
    "username": "coinprice",
    "mrkdwn": true
  }
return res;
}


function getEmoji(value){
  var emoji = ":smile:";
  switch(true) {
    case value>0:
        emoji = ":smile:";
        break;
    case value<0:
        emoji = ":upside_down_face:";
        break;
    default:
        emoji=":smile:";
}
return emoji;
}

function calculatePriceChange(data , mimutes){
  var end = data[data.length - 1].close;
  var start = data[data.length - mimutes].close;
  var priceChange = (1 - (start / end)) * 100
  return priceChange.toFixed(2);
}


function createSuccessResponseForSnapShot(data){
  var text  = createText(data);
  var res = { 
    "text": "*BTC =* " + data.BTC  + " *EUR =* " + data.EUR + " *USD =* "+ data.USD,
    "username": "coinprice",
    "mrkdwn": true
  }
return res;
}


function createText(data){

}


//price 
function getPrice(coin,callback){
var api = "price";
var fsym = "fsym";
  if (coin.indexOf(',') > -1){
    api ="pricemulti"
    fsym = "fsyms"
  }
coin = coin.toUpperCase();
url = 'https://min-api.cryptocompare.com/data/'+api+'?'+fsym+'='+coin+'&tsyms=BTC,USD,EUR'
  rest.get(url).on('complete', function(data) {   
    console.log(data); // auto convert to object
    callback(null ,data) 
  });
}

module.exports = router;





function coinPriceSnapShot(coin,callback){
coin = coin.toUpperCase();  
url= 'https://www.cryptocompare.com/api/data/coinsnapshot/?fsym='+ coin +'&tsym=USD'
console.log(url);
rest.get(url).on('complete', function(data) {   
  console.log(data); // auto convert to object
  callback(null ,data) 
});
}



function aggregateDataLast24Hours(coin,callback){
  coin = coin.toUpperCase();  
  url= 'https://min-api.cryptocompare.com/data/histominute?fsym='+coin+'&tsym=USD&limit=1460&aggregate=1&e=CCCAGG'
  rest.get(url).on('complete', function(data) {   
    callback(null ,data) 
  });
  }