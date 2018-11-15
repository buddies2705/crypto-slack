var request = require('request');
var fs = require('fs');
var path = require('path');
const ChartjsNode = require('chartjs-node');
// 600x600 canvas size
var chartNode = new ChartjsNode(600, 600);


function getChart(chartJsOptions){
chartNode.drawChart(chartJsOptions)
.then(() => {
    // chart is created

    // get image as png buffer
    return chartNode.getImageBuffer('image/png');
})
.then(buffer => {
    Array.isArray(buffer) // => true
    // as a stream
    return chartNode.getImageStream('image/png');
})
.then(streamResult => {
    // using the length property you can do things like
    // directly upload the image to s3 by using the
    // stream and length properties
    streamResult.stream // => Stream object
    streamResult.length // => Integer length of stream
    // write to a file
    return chartNode.writeImageToFile('image/png', './chart.png');
})
.then(() => {
    request.post({
        url: 'https://slack.com/api/files.upload',
        formData: {
            token: 'ENTER_YOUR_TOKEN',
            title: "Chart",
            filename: "chart.png",
            filetype: "auto",
            channels: 'YOUR_CHANNEL_ID',
            file: fs.createReadStream(path.resolve("chart.png")),
        },
      }, function (err, response) {
        console.log(JSON.parse(response.body));
      });
});
}

module.exports.getChart = getChart;