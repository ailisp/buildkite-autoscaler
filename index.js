// Expected env settings
let webhook_token = process.env.WEBHOOK_TOKEN;

let https      = require('https');
let express    = require('express');
let bodyParser = require('body-parser');

let app = express();
app.use(bodyParser.json());

app.post('/', function(req, res){

  console.log('Received POST', req.headers, req.body);

  // Verify token
  if (req.headers['x-buildkite-token'] != webhook_token) {
    console.log("Invalid webhook token");
    return res.status(401).send('Invalid token');
  }

  let buildkiteEvent = req.headers['x-buildkite-event'];

  if (buildkiteEvent == 'job.activated') {
    console.log('----------------------Job Activating-------------------');
    console.log(req.body)
  }

  if (buildkiteEvent == 'job.finished') {
    console.log('-----------------------Job Finished--------------------')
    console.log(req.body)
  }

  res.send('buildkite process down');
});

app.get('/', function(req, res){
  res.send("You almost there");
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Express listening on port', this.address().port);
});

