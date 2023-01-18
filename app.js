import createSubscriber from "pg-listen"
import * as crontab from 'crontab';

const endpoint = process.env.THESIS_UPLOAD_API_ENDPOINT
const databaseURL = process.env.DATABASE_URL
const channel = "thesis_confirmed_deposit"
const minutesIntervalString = process.env.MINUTES_INTERVAL
const minutesIntervalArray = minutesIntervalString? minutesIntervalString.split(',').map(Number).filter(item => !isNaN(item)) : [1, 6, 20, 80];

if (!endpoint) {
  console.error('Upload API endpoint not set in env variables')
  process.exit(1)
}

if (!databaseURL) {
  console.error('Database settings not set in env variables')
  process.exit(1)
}

const subscriber = createSubscriber({ connectionString: databaseURL })

subscriber.events.on("error", (error) => {
  console.error(channel, error)
  process.exit(1)
})

subscriber.notifications.on(channel, (payload) => {

  console.log(`[${new Date()}] - Received notification for deposit with id ${payload.id}`)

  if (payload.confirmed) {

    crontab.load(function(err, crontab) {

      var command = `/usr/bin/curl -X POST ${endpoint} -H 'Content-Type: application/json' -d '{"deposit_id":${payload.id}}'`
      var comment = `#deposit${payload.id}upload`

      crontab.remove({comment: comment});

      crontab.save(function(err, crontab) {
      });

      var d = new Date();

      minutesIntervalArray.forEach(minutes => {
        d.setMinutes(d.getMinutes() + minutes);
        crontab.create(command, d, comment);
      })

      crontab.save(function(err, crontab) {
      });

    });

  }

})

process.on("exit", () => {
  subscriber.close()
})

export async function connect () {
  await subscriber.connect()
  await subscriber.listenTo(channel)
}

connect()
