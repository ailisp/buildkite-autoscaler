// Expected env settings
let webhook_token = process.env.WEBHOOK_TOKEN || "75798f26a45424ecb9074d0519d8688f";

let https      = require('https');
let express    = require('express');
let bodyParser = require('body-parser');
let fetch      = require('node-fetch')

let app = express();
app.use(bodyParser.json());

app.post('/', function(req, res){

  console.log('Received POST', req.headers);

  // Verify token
  if (req.headers['x-buildkite-token'] != webhook_token) {
    console.log("Invalid webhook token");
    return res.status(401).send('Invalid token');
  }

  let buildkiteEvent = req.headers['x-buildkite-event'];
  let id, machineName;

  if (buildkiteEvent == 'job.scheduled') {
    console.log('----------------------Job Scheduled-------------------');
    id = req.body.job.id
    const rules = req.body.job.agent_query_rules
    const queueName = rules[0].substring(6)
    if (queueName === "testqueue"){
      const initScript = `sudo sh -c 'echo deb https://apt.buildkite.com/buildkite-agent stable main > /etc/apt/sources.list.d/buildkite-agent.list'
                          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 32A37959C2FA5C3C99EFBC32A79206696452D198
                          sudo apt-get update && sudo apt-get install -y buildkite-agent
                          sudo sed -i "s/xxx/563badd9f5be9380cfea98c5959e92d34ca063964c5bba223d/g" /etc/buildkite-agent/buildkite-agent.cfg
                          sudo echo 'tags="queue=${queueName}"' >> /etc/buildkite-agent/buildkite-agent.cfg
                          sudo systemctl enable buildkite-agent && sudo systemctl start buildkite-agent
                          `
      const body = { group_name : queueName, init_script : initScript}
      fetch('http://167.71.120.160:5000/machines', { 
        method: "POST", 
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => machineName = JSON.parse(res).machine_name)
      console.log(machineName)
    
    console.error(`queue name is incorrect! ${queueName}`)
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

