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

const java = '/usr/bin/java';
const javac = '/usr/bin/javac';

let connections = 0;

io.on('connection', (socket) => {
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

  connections = connections + 1;

  console.log('connection:', socket.id);
  socket.on('eval', async (data) => {
    let classFile, javaFile, mainClassName;

    const error = [];
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
              name    : 'Main.java'
            , content : data.code
          }];
        }

        files.forEach(async (file) => {
          await writeFile(`${dir}/${file.name}`, file.content);
        });

        javaFile = files[0].name;
        ignoreFiles.push(`${dir}/${javaFile}`);

        mainClassName = javaFile.substring(0, javaFile.indexOf('.java'));
        classFile = javaFile.replace(/\.java$/, '.class');
        ignoreFiles.push(`${dir}/${classFile}`);
      }
    }

    // add files from above and any ".class" files to ignored
    const ignored = ignoreFiles.concat([/[\/\\]\./, /\.class$/]);

    watcher = chokidar.watch(dir, {
      ignored: ignored,
      ignoreInitial : true,
      persistent : true,
      awaitWriteFinish : {
        stabilityThreshold : 500
      }
    });

    watcher.on('add', (added) => {
      const fileinfo = {
        name : path.basename(added),
        buffer : readFileSync(added)
      };
      socket.emit('file added', fileinfo);
      if (watchesInProgress[ fileinfo.name ]) {
        delete watchesInProgress[ fileinfo.name ];
      }
    });
    watcher.on('change', (changed) => {
      const fileinfo = {
        name : path.basename(changed),
        buffer : readFileSync(changed)
      };
      socket.emit('file added', fileinfo);
      if (watchesInProgress[ fileinfo.name ]) {
        delete watchesInProgress[ fileinfo.name ];
      }
    });
    watcher.on('raw', (event, filepath, details) => {
      var watching = filepath || path.basename(details.watchedPath);
      if (watching) {
        watchesInProgress[watching] = true;
      }
    });

    watcher.on('error', (error) => {
      console.log('watcher error:', error);
    });

    watcher.on('ready', () => {
      // compile
      const compiler_args = [javaFile];
      const compiler_options = { 'cwd': dir };
      const compiler_error = [];
      const compiler = child_process.spawn(javac, compiler_args, compiler_options);

      // strings rather than buffers
      compiler.stdout.setEncoding('utf-8');
      compiler.stdin.setEncoding('utf-8');
      compiler.stderr.setEncoding('utf-8');

      compiler.stderr.on('data', (data) => {
        console.log('compiler stderr data:', data);
        compiler_error.push(data);
      });

      // just in case
      compiler.stdout.on('data', (data) => {
        console.log('compiler stdout data:', data);
      });
      compiler.on('error', (err) => {
        console.log('compiler error:', err);
      });

      compiler.on('exit', (code, signal) => {
        console.log('compiler code:', code);
        if (code === 0) {
          try {
            accessSync(`${dir}/${classFile}`, constants.R_OK | constants.W_OK);
            child = child_process.spawn(java, [mainClassName], {cwd:dir});
            console.log('child?', typeof(child));

            // strings rather than buffers
            child.stdout.setEncoding('utf-8');
            child.stdin.setEncoding('utf-8');
            child.stderr.setEncoding('utf-8');

            // any time the child process writes to stdout
            child.stdout.on('data', (data) => {
              console.log('stdout data?', data);
              socket.emit('stdout', data);
            });

            child.stderr.on('data', (err) => {
              error.push(err);
            });

            // catch stdout, stdin, stderr errors
            const pipeErrorHandler = (err) => {
              console.log('pipe error:', err);
              socket.emit('script error', {
                error : 'Error: The java process ended unexpectedly. Please try running your program again.'
              }, () => {
                // force disconnect
                socket.disconnect();
              });
            }

            child.stdout.on('error', pipeErrorHandler);
            child.stdin.on('error', pipeErrorHandler);
            child.stderr.on('error', pipeErrorHandler);

            child.on('exit', (code, signal) => {
              childEnded = true;
              console.log('child exit:', code, signal);

              if (error.length) {
                childEndedLog = error.join('');

                // tell the browser if there was an error with the script
                socket.emit('script error', {
                  error : childEndedLog
                });
              }
              else {
                childEndedLog = "Code: " + code + ", Signal: " + signal;
              }

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
                  try {
                    rmSync(dir, { recursive: true, force: true });
                  } catch(e) {
                    console.log('child exit, rmSync error:', e);
                  }
                }
              })();
            });

            childReady = true;
          } catch (err) {
            console.log('access err?', err);
            socket.emit('compile error', {
              error : compiler_error.length ? compiler_error.join('') : 'Some unknown compiler error occurred. Please check your program and try again.'
            });
          }
        }
        else {
          socket.emit('compile error', {
            error : compiler_error.length ? compiler_error.join('') : 'Some unknown compiler error occurred. Please check your program and try again.'
          });
        }
      }); // end compiler exit
    }); // end watcher ready
  }); // end socket on eval

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

    console.log('write input:', input);

    // a multiline statement where the next to last line was indented
    // needs an extra newline
    if (inputLines.length > 1 && /^[\s\#]+/.test(inputLines[inputLines.length - 2])) {
      input += '\n';
    }

    // it's possible the child isn't ready yet...
    (function stdinWrite(input) {
      console.log('stdinWrite childReady:', childReady);
      if (childReady && !childEnded) {
        child.stdin.write(input);
      }
      else if (childReadyCurrent <= childReadyLimit) {
        setTimeout(function() {
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
          error : "Error: The java process ended unexpectedly. Please try running your program again."
        }, () => {
          // force disconnect
          socket.disconnect();
        });
      }
    })(input);
  }); // end socket on write

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
    console.log('disconnecting');
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
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch(e) {
      console.log('socket disconnect, rmSync error:', e);
    }
  }); // end socket on disconnect
});

httpServer.listen(8010);
