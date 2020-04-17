// Expected env settings
let webhook_token = process.env.WEBHOOK_TOKEN || "75798f26a45424ecb9074d0519d8688f";

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

  if (buildkiteEvent == 'job.scheduled') {
    console.log('----------------------Job Scheduled-------------------');
    const rules = req.body.job.agent_query_rules
    const queueName = rules[0].substring(6)
    console.log(queueName)
    }

  if (buildkiteEvent == 'job.finished') {
    console.log('-----------------------Job Finished--------------------')
    const rules = req.body.job.agent_query_rules
    const queueName = rules[0].substring(7)
    console.log(queueName)
  }

  if(buildkiteEvent == 'build.finished') {
    console.log('-----------------------Build Finished-------------------')
    const state = req.body.build.state
    console.log(state)
  }

  res.send('buildkite process down');
});

app.get('/', function(req, res){
  res.send("You almost there");
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Express listening on port', this.address().port);
});

