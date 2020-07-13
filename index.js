// Expected env settings
let webhook_token = process.env.WEBHOOK_TOKEN || "75798f26a45424ecb9074d0519d8688f";
let queues = process.env.QUEUES || 'bridge,bridge-expensive'
queues = queues.split(',')


let https      = require('https');
let express    = require('express');
let bodyParser = require('body-parser');
let fetch      = require('node-fetch')

const agentQueue = (rules) => {
  let queueName = ''
  if (rules) {
    for(let r of rules) {
      if(r.substring(0, 6) === 'queue=') {
        queueName = r.substring(6)
        break
      }
    }
  }
  return queueName;
}

let app = express();
app.use(bodyParser.json());

app.post('/', async function(req, res){
  // Verify token
  if (req.headers['x-buildkite-token'] != webhook_token) {
    console.log(req.headers['x-buildkite-token'])
    console.log("Invalid webhook token");
    return res.status(401).send('Invalid token', req.headers['x-buildkite-token']);
  }

  let buildkiteEvent = req.headers['x-buildkite-event'];
  let id, machineName;

  if (buildkiteEvent == 'job.scheduled') {
    console.log('----------------------Receive Job from Buildkite-------------------');
    id = req.body.job.id
    const rules = req.body.job.agent_query_rules
    let queueName = agentQueue(rules)

    if (queueName && queues.includes(queueName)){
      console.log('Job URL: ' + req.body.job.web_url)
      console.log('Job Name: ' + req.body.job.name)
      console.log('Request create a machine in: ' + queueName)
      const initScript = `
                        echo >> ~/.buildkite-agent/buildkite-agent.cfg
                        echo 'tags="queue=${queueName}"' >> ~/.buildkite-agent/buildkite-agent.cfg
                        echo 'disconnect-after-job=true' >> ~/.buildkite-agent/buildkite-agent.cfg
                        echo 'timestamp-lines=true' >> ~/.buildkite-agent/buildkite-agent.cfg
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
        console.log('Request create machine sent. Machine name: ' + machineName)
      } catch (e) {
        console.error("================= Error in request creating machine")
        console.error(e)
      }

    }else {
      console.log(`Queue name '${queueName}' is not managed by buildkite-autoscaler, skipping`)
    }
  } else if (buildkiteEvent == 'job.finished') {
    console.log('-----------------------Recieve Job Finished from Buildkite--------------------')
    try {
      const rules = req.body.job.agent_query_rules
      let queueName = agentQueue(rules)

      if (queueName && queues.includes(queueName) && req.body.job.agent){
        const ip = req.body.job.agent.ip_address
        const res = await fetch(`http://localhost:5000/machines/ip/${ip}`, {
          method: "DELETE"
        })
        console.log('Job URL: ' + req.body.job.web_url)
        console.log('Job Name: ' + req.body.job.name)
        console.log('Agent Name: ' + req.body.job.agent.name)
        console.log('Agent IP: ' + ip)
        console.log('Request delete machine sent. Machine IP: ' + ip)
      } else {
        console.log(`Queue name '${queueName}' is not managed by buildkite-autoscaler or build didn't scheduled to agent, skipping`)
      }
    } catch (e) {
      console.error("================= Error in request deleting machine")
      console.error(e)
    }
  }

  res.send('buildkite process down');
});

app.get('/', function(req, res){
  res.send("You almost there");
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Express listening on port', this.address().port);
});

