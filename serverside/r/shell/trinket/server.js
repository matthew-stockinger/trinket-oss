import * as child_process from 'child_process';
const {
  createHash
} = await import('node:crypto');
import { mkdir, writeFile } from 'node:fs/promises';
import {
  accessSync,
  constants,
  readFileSync,
  rmSync
} from 'node:fs';
import * as chokidar from 'chokidar';
import * as path from 'node:path';

import { createServer } from 'http';
import { Server } from 'socket.io';

import _ from 'underscore';

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

const R = '/usr/bin/R';
const Rscript = '/usr/bin/Rscript';

let connections = 0;

io.on('connection', function(socket) {
  let watcher;
  const watchesInProgress = {}
  const watchInProgressLimit = 2000
  const watchInProgressInterval = 250
  const watcherStabilityThreshold = 500
  let watchInProgressCurrent = 0;

  let child;
  let childReady = false;
  let childEnded = false;
  let childEndedLog = undefined;

  const childReadyLimit = 5000;
  const childReadyInterval = 250;
  let childReadyCurrent = 0;

  let dir;
  let readingUserInput = false;

  connections = connections + 1;

  console.log('connection:', socket.id);

  // setup child process and event listeners
  socket.on('eval', async (data) => {
    const args = [];
    const options = {};
    const ignoreFiles = [];

    if (data.init) {

      const sha = createHash('sha256');
      sha.update(Math.random().toString());
      const sessionId = sha.digest('hex').substr(0, 16);
      console.log('sessionId:', sessionId);

      dir = `/tmp/sessions/${sessionId}`;
      console.log('dir:', dir);
      await mkdir(dir, { recursive: true });

      if (data.code) {
        let files;

        try {
          files = JSON.parse(data.code);
          if (!Array.isArray(files)) {
            throw new Error();
          }
        } catch(e) {
          files = [{
              name    : 'main.R'
            , content : data.code
          }];
        }

        files.forEach(async (file) => {
          await writeFile(`${dir}/${file.name}`, file.content);
        });

        ignoreFiles.push(`${dir}/${files[0].name}`);
      }
      else if (data.files) {
        let files;

        try {
          files = JSON.parse(data.files);
          if (!_.isObject(files)) {
            files = {};
          }
        } catch(e) {
          files = {};
        }

        const filenames = _.keys(files);
        filenames.forEach(async (name) => {
          await writeFile(`${dir}/${name}`, files[name]);
        });

        if (filenames.length) {
          ignoreFiles.push(`${dir}/${filenames[0].name}`);
        }
      }
    }

    // add files from above to ignored
    const ignored = ignoreFiles.concat(/[\/\\]\./);

    watcher = chokidar.watch(dir, {
      ignored: ignored,
      ignoreInitial: true,
      persistent: true,
      alwaysStat: true,
      awaitWriteFinish : {
        stabilityThreshold : watcherStabilityThreshold
      }
    });

    watcher.on('add', (added, stats) => {
      if (stats && !stats.size) {
        return;
      }

      const fileinfo = {
        name: path.basename(added),
        buffer: readFileSync(added)
      };
      socket.emit('file added', fileinfo);
      if (watchesInProgress[ fileinfo.name ]) {
        delete watchesInProgress[ fileinfo.name ];
      }
    });
    watcher.on('change', (changed, stats) => {
      if (stats && !stats.size) {
        return;
      }

      const fileinfo = {
        name: path.basename(changed),
        buffer: readFileSync(changed)
      };
      socket.emit('file added', fileinfo);
      if (watchesInProgress[ fileinfo.name ]) {
        delete watchesInProgress[ fileinfo.name ];
      }
    });
    watcher.on('raw', (event, filepath, details) => {
      const watching = filepath || path.basename(details.watchedPath);
      if (watching) {
        watchesInProgress[watching] = true;
        watchInProgressCurrent = 0;
      }
    });

    watcher.on('error', (error) => {
      console.log('watcher error:', error);
    });

    // arguments to R
    args.push('--vanilla');

    if (data.interactive) {
      // force interactive
      args.push('--interactive');

      // don't print startup message
      args.push('-q');
    }
    else {
      args.push('main.R');
    }

    options.cwd = dir;

    watcher.on('ready', () => {
      // eventually chroot
      child = data.interactive
        ? child_process.spawn(R, args, options)
        : child_process.spawn(Rscript, args, options);

      // strings rather than buffers
      child.stdout.setEncoding('utf-8');
      child.stdin.setEncoding('utf-8');
      child.stderr.setEncoding('utf-8');

      // any time the child process writes to stdout
      child.stdout.on('data', (data) => {
        console.log('child stdout data:', data);

        let emitDone = false;

        if (readingUserInput) {
          // split this data because the first line can contain user input...
          let dataLines = data.split(/\n/);

          if (dataLines.length > 1) {
            // remove user input line
            dataLines.shift();

            // re-join remaining lines
            // could be actual program output
            data = dataLines.join("\n");

            // no longer reading user input
            readingUserInput = false;
          }
          else {
            data = "";
          }

          // still reading user input
          if (data.length === 0) {
            return;
          }
        }

        // once we're done reading user input, emit normally

        if (/>\s+$/.test(data)) {
          data = data.replace(/>\s+$/, "");
          emitDone = true;
        }

        if (data.length) {
          socket.emit('stdout', data, () => {
            if (emitDone) {
              socket.emit('done');
            }
          });
        }
        else if (emitDone) {
          socket.emit('done');
        }
      });

      // any time the child process writes to stderr
      // these could be real errors or the prompt when in interactive mode

      child.stderr.on('data', (err) => {
        console.log('child stderr data:', err);
        socket.emit('done', {
          error : err
        });
      });

      // catch stdout, stdin, stderr errors
      const pipeErrorHandler = (err) => {
        console.log("pipe error:", err);
        socket.emit('script error', {
          error : "Error: The R process ended unexpectedly. Please try running your program again."
        }, function() {
          // force disconnect
          socket.disconnect();
        });
      }

      child.stdout.on('error', pipeErrorHandler);
      child.stdin.on('error', pipeErrorHandler);
      child.stderr.on('error', pipeErrorHandler);

      // process ended
      child.on('exit', (code, signal) => {
        childEnded    = true;
        childEndedLog = "Code: " + code + ", Signal: " + signal;

        (function exitFunc() {
          if (!_.isEmpty(watchesInProgress) && watchInProgressCurrent <= watchInProgressLimit) {
            setTimeout( exitFunc, watchInProgressInterval );
            watchInProgressCurrent += watchInProgressInterval;
          }
          else {
            socket.emit('exit');
            if (watcher) {
              watcher.close();
            }
            if (dir) {
              try {
                rmSync(dir, { recursive: true, force: true });
              } catch(e) {
                console.log('child exit, rimraf error:', e);
              }
            }
          }
        })();
      });

      child.on('error', (err) => {
        console.log('child error:', err);
      });

      childReady = true;

      socket.emit('child ready');

    }); // end watcher.on ready

  });

  // received input from browser
  socket.on('write', (data) => {
    let inputLines = data.input.split('\n');

    let lastLine = inputLines.pop();

    // remove any leading spaces from last line
    lastLine = lastLine.replace(/^\s+/g, '');

    // add newline to last line if it doesn't have one
    if (lastLine.length && !/\n$/.test(lastLine)) {
      lastLine += '\n';
    }

    inputLines.push(lastLine);
    let input = inputLines.join('\n');

    // a multiline statement (from console mode) where the next to last line was indented needs an extra newline
    if (inputLines.length > 1 && /^[\s\#]+/.test(inputLines[inputLines.length - 2]) && data.from === 'console') {
      input += '\n';
    }

    // it's possible the child isn't ready yet...
    (function stdinWrite(input) {
      if (childReady && !childEnded) {
        child.stdin.write(input);
        readingUserInput = true;
      }
      else if (childReadyCurrent <= childReadyLimit) {
        setTimeout(() => {
          stdinWrite(input);
        }, childReadyInterval);
        childReadyCurrent += childReadyInterval;
      }
      else {
        if (childEnded) {
          console.log('child process ended:', childEndedLog);
        }
        else {
          console.log('child process never ready!');
        }

        socket.emit('script error', {
          error : "Error: The R process ended unexpectedly. Please try running your program again."
        }, () => {
          // force disconnect
          socket.disconnect();
        });
      }
    })(input);
  });

  // catch any errors
  // probably need a better way to expose these
  // and do something when they occur
  socket.on('error', (err) => {
    console.log('socket error:', err);
  });

  // query how many connections there are
  socket.on('connections', () => {
    // don't count this connection
    socket.emit('current connections', connections - 1);
  });

  socket.on('disconnect', () => {
    connections = connections - 1;
    if (child) {
      // sometimes kill won't work if child is waiting on stdin
      child.stdin.end();

      try {
        child.kill('SIGKILL');
      } catch(e) {
        console.log("kill error:", e);
      }
    }
    if (watcher) {
      watcher.close();
    }
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch(e) {
        console.log('socket disconnect, rimraf error:', e);
      }
    }
  });
});

httpServer.listen(8010);

