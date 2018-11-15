var express = require('express');
var rest = require('restler');
var charts = require('./charting')
var router = express.Router();
var eventMap = {};
var chartEventMap = {};
var path = require('path');
var request = require('request');
var fs = require('fs');
var Twitter = require('twitter');

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});


router.get('/' , function(req , res) {
 res.send("ok");
});



router.post('/', function(req, res) {
  var coinName = req.body.text;
    aggregateDataLast24Hours(coinName , function (err , data){
      var result =createSuccessResponseForLast24Data(data.Data ,coinName); 
      res.send(result);       
    });
});

router.post('/message', function(req, res) {
  try{
  // console.log(req);
  if(req.body.challenge != undefined){
    res.send(req.body.challenge)
  }
  
   var coinName = getCoin(req.body.event.text);
  if(coinName != "nocoin"){
     if(req.body.event.text.substring(0,3)=="?p "){
      // if(!checkDoubleSend(coinName ,req.body.event_id )){
      //   return;
      // }
         aggregateDataLast24Hours(coinName , function (err , data){
        postToWebhook(data , coinName);
      });
    }else{
        sendChart(coinName , req.body.event_id);
    }
  }
}
catch(err){
  console.log(err);
}
});



function sendChart(coinName ,eventId ){
  // if(!checkChartDoubleSend(coinName ,eventId )){
  //   return;
  // }
    data = getChartData(coinName, function(err , data) {
      cookedData = prepareData(data.Data)
      getChart(cookedData , coinName);   
      uploadChart(coinName);        
    });
}


function postToWebhookForCharts(data , coinName){
  rest.post('https://hooks.slack.com/services/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', {
    data: JSON.stringify(createSuccessResponseForCharts(coinName))
  }).on('complete', function(data, response) {
    console.log(response);
  }).on('fail' , function(data, response){
    console.log(response)
  }).on('success' , function(data, response){
    console.log(response)
  });
}



function uploadChart(coinName){

}

function prepareData(data){
  var obj = {};
  var timeArr = [];
  var coinValueArr = [];
  data.forEach(element => {
    timeArr.push(element.time * 1000)
    coinValueArr.push(element.close) //proper epoch time
  });
  obj['time'] = timeArr;
  obj['value'] = coinValueArr;
return obj;
}

function getChart(data , coinName){
 if(data.time.length >0){
   options = getChartOptions(data,coinName);
   charts.getChart(options)
    }
}


function getChartData(coin , callback){
  coin = coin.toUpperCase();  
  url= 'https://min-api.cryptocompare.com/data/histominute?fsym='+coin+'&tsym=USD&limit=1440&aggregate=1&e=CCCAGG'
  // console.log(url);
  rest.get(url).on('complete', function(data) {   
    // console.log(data); // auto convert to object
    callback(null ,data) 
  });
}



// function checkDoubleSend(coinName , eventId){
//   if(eventMap[coinName] == undefined){
//     eventMap[coinName]=eventId;
//     return true;
//   }
//   if(eventMap[coinName] == eventId){
//     return false;
//   }
//   eventMap[coinName]= eventId;
//   return true;
// }


// function checkChartDoubleSend(coinName , eventId){
//   if(chartEventMap[coinName] == undefined){
//     chartEventMap[coinName]=eventId;
//     return true;
//   }
//   if(chartEventMap[coinName] == eventId){
//     return false;
//   }
//   chartEventMap[coinName]= eventId;
//   return true;
// }

function postToWebhook(data , coinName){
  rest.post('YOUR_WEBHOOK_URL', {
    data: JSON.stringify(createSuccessResponseForLast24Data(data.Data ,coinName))
  }).on('complete', function(data, response) {
    // console.log(response);
  });
}


function getCoin(text){
  if(text.substring(0,3)=="?p " || text.substring(0,3)=="?c "){
    return text.substr(text.indexOf(" ")+1, text.length - 1);
  }
  if(text.substring(0,4)=="?ico" ){
    return "liveico"
  }
  return "nocoin";
}


function createSuccessResponseForCharts(coinName ){
  var res = {
    "text": "Last 2 days price chart for " + coinName ,
    "attachments": [
        {
          "text": "chart",          
          "image_url": path.resolve("chart.png")
        }
    ]
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
    // console.log(data); // auto convert to object
    callback(null ,data) 
  });
}

module.exports = router;





function coinPriceSnapShot(coin,callback){
coin = coin.toUpperCase();  
url= 'https://www.cryptocompare.com/api/data/coinsnapshot/?fsym='+ coin +'&tsym=USD'
// console.log(url);
rest.get(url).on('complete', function(data) {   
  // console.log(data); // auto convert to object
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



  function getChartOptions(values , coinName){
    var options = {
      type: 'line',
      data: {
        labels: values['time'],
        datasets: [
            {
                label: coinName + " price(Last 2 Days)",
                backgroundColor: "rgba(26, 31, 31,1)",
                borderColor: "rgba(75,192,192,1)",
                data: values['value'],
                fill:false
            }
        ]
    },
      options: {
        showLines : true,
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              displayFormats: {
                'millisecond': 'lll',
                'second': 'lll',
                'minute': 'lll',
                'hour': 'lll',
                'day': 'lll',
                'week': 'lll',
                'month': 'lll',
                'quarter': 'lll',
                'year': 'lll',
              }
            }
          }],
        },
      }
  
    }
  return options;  
  }

