// Expected env settings
let webhook_token = process.env.WEBHOOK_TOKEN || "75798f26a45424ecb9074d0519d8688f";

let https      = require('https');
let express    = require('express');
let bodyParser = require('body-parser');
let fetch      = require('node-fetch')

let app = express();
app.use(bodyParser.json());

app.post('/', async function(req, res){

  console.log('Received POST');

  // Verify token
  if (req.headers['x-buildkite-token'] != webhook_token) {
    console.log(req.headers['x-buildkite-token'])
    console.log("Invalid webhook token");
    return res.status(401).send('Invalid token', req.headers['x-buildkite-token']);
  }

  let buildkiteEvent = req.headers['x-buildkite-event'];
  let id, machineName;

  if (buildkiteEvent == 'job.scheduled') {
    console.log('----------------------Job Scheduled-------------------');
    id = req.body.job.id
    const rules = req.body.job.agent_query_rules
    const queueName = rules[0].substring(6)
    if (queueName === "bridge"){
      const initScript = `
                        TOKEN="563badd9f5be9380cfea98c5959e92d34ca063964c5bba223d" bash -c "\`curl -sL https://raw.githubusercontent.com/buildkite/agent/master/install.sh\`"
                        echo >> ~/.buildkite-agent/buildkite-agent.cfg
                        echo 'tags="queue=${queueName}"' >> ~/.buildkite-agent/buildkite-agent.cfg
                        echo 'disconnect-after-job=true' >> ~/.buildkite-agent/buildkite-agent.cfg
                        ~/.buildkite-agent/bin/buildkite-agent start
                        `
      const body = { group_name : queueName, init_script : initScript}
      try {
        const res = await fetch('http://localhost:5000/machines', { 
          method: "POST", 
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        })

        machineName = (await res.json()).machine_name
      } catch (e) {
        console.error("=================")
        console.error(e)
      }

    }else {
      console.error(`queue name is incorrect! ${queueName}`)
    }
    console.log(machineName)
  }

  if (buildkiteEvent == 'job.finished') {
    console.log('-----------------------Job Finished--------------------')
    console.log(req.body.job.agent.ip_address)
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

