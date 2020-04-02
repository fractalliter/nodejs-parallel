'strict mode'

const fs = require('fs');
const cluster = require('cluster');
const numberOfCpus = require('os').cpus().length;
const crypto = require('crypto');

// Generating a 16 byte random id with random bytes method of crypto module
function random(getId){
  getId(crypto.randomBytes(16).toString('hex'));
}

const t = [];
const myTasks = [];

// Creating a queue of 100 tasks
for (let i = 0; i < 100; i++) {
  myTasks.push(random);
}

// Calculating the chunk of tasks for every cpu of machine
const chunk = Math.ceil(myTasks.length / numberOfCpus);

// Dividing tasks for every cpu of machine
for (let i = 0; i < numberOfCpus; i++) {
  let currentIndex = i * chunk;
  t.push(myTasks.slice(
      currentIndex,
      (currentIndex + chunk < myTasks.length) 
      ? currentIndex + chunk 
      : myTasks.length));
}

// Cluster processes for parallel processing
if (cluster.isMaster) {
  // Fork the process for every cpu of machine with a processIndex environment varaible for every of them
  for (let i = 0; i < numberOfCpus; i++) cluster.fork({processIndex: i});
} else {
  // Get every task for every worker process to be executed concurrently
  const tasks = t[process.env.processIndex];
  const len = tasks.length;
  let concurrency = 2, running = 0, completed = 0, index = 0;
  function next() {
    while (running < concurrency && index < len) {
      let task = tasks[index++];
      task(uuid => {
        // Out put every random id to file
        fs.appendFile(
            'uuids.txt',
            `ID: ${uuid.toString().replace("\n", "")} from process ID: ${process.pid}\n`,
            () => {});
        if (completed === len) return finish();
        completed++, running--;
        next();
      });
      running++;
    }
  }

  next();

  // Finish the process and exit with completion code
  function finish() {
    console.log('Tasks completed');
    process.exit(0);
  }
}
