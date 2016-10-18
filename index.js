var readline = require('readline')
var fs = require('fs')
var exec = require('child_process').exec
var rimraf = require('rimraf').sync
var path = require('path')
var uuid = require('node-uuid').v4


var repo = 'https://git-chat-client:git-chat1@github.com/git-chat-client/git-chat-messages.git'
var dir = process.argv.length > 2 ? process.argv[2] : path.join(process.env.HOME, '.git-chat')
var uuidFile = path.join(dir, 'uuid.txt')
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

var commit = null

rimraf(dir)

exec('git clone ' + repo + ' ' + dir, function(error, stdout, stderr) {
  if (error) {
    throw new Error(error)
  }

  getCommit()

  console.log(stdout)
  console.log(stderr)
  prompt()

  rl.on('line', function(line) {
    prompt()

    fs.writeFileSync(uuidFile, uuid())

    push(line)
  })
})

setInterval(pull, 1000)

rl.on('close', function() {
  rimraf(dir)
})

process.on('SIGINT', function() {
  rimraf(dir)
  process.exit()
})

function prompt() {
  process.stdout.write(">> ")
}

function execInDir(cmd, fn, quiet) {
  exec('cd ' + dir + ' && ' + cmd, function(error, stdout) {
    if (!quiet && error) {
      console.log(error)
    }

    if (fn) {
      fn(stdout)
    }
  })
}

function push(line) {
  execInDir('git commit -am "' + line + '" && git push', getCommit)
}

function pull() {
  execInDir("git pull", function() {
    execInDir('git log', function(log) {
      var sections = log.split(commit)

      // Race condition hack
      log = sections.length === 1 ? [] : sections[0].split('\n')

      if (log.length > 1) {
        process.stdout.clearLine()
        process.stdout.cursorTo(0)

        log.forEach(function(line) {
          var match = line.match("    (.+)")

          if (match) {
            console.log(match[1])
          }
        })

        getCommit()
        prompt()
      }
    })
  }, true)
}

function getCommit() {
  exec('git log | head -n1', function(error, stdout) {
    commit = stdout
  })
}