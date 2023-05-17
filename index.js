// Copyright (c)2022 Quinn Michaels
// The Socket Deva

const fs = require('fs');
const path = require('path');

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Socket = require('socket.io');

const Deva = require('@indra.ai/deva');
const SOCKET = new Deva({
  agent: {
    id: agent.id,
    key: agent.key,
    name: agent.name,
    describe: agent.describe,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {
    /**************
    func: socket
    params: packet
    describe: Socket listener that sends the broadcast event to the available
    socket.
    ***************/
    'socket'(packet) {
      if (!packet || !this.active) return;
      this.func.emit({say:packet.event, message:packet.data}).then(() => {
        this.talk(`${packet.event}:${packet.id}`, true);
      })
    },

    /**************
    func: error
    params: packet
    describe: Broadcast errors to the socket.
    ***************/
    'error'(packet) {
      if (!packet || !this.active) return;
      this.func.emit({say:'error', message:packet});
    },

    /**************
    func: socket:terminal
    params: packet
    describe: pass a message to the socket terminal then talk a response when
    the socket broadcast is complete from the socketTreminal function.
    ***************/
    'socket:terminal'(packet) {
      if (!packet || !this.active) return;

      this.func.socketTerminal(packet).then(result => {
        this.talk(`socket:terminal:${packet.id}`, true)
      }).catch(err => {
        this.talk('error', {err: err.toString('utf8')});
      });
    },

    /**************
    func: systems
    params: packet
    describe: system listenr to broadcast system events to the socket.
    ***************/
    'system'(packet) {
      if (!packet || !this.active) return;
      this.func.systemEvent(packet).then(result => {
        this.talk(`system:${packet.id}`, true)
      }).catch(err => {
        this.talk('error', {err: err.toString('utf8')});
      })
    },
  },
  modules: {
    socket: false,
    server: require('http').createServer(),
  },
  sockets: {},
  deva: {},
  func: {
    /**************
    func: socketTerminal
    params: packet
    describe: Send the packet information to the available socket terminal.
    ***************/
    socketTerminal(packet) {
      // this is where we emit to the client socket oh yeah
      setImmediate(() => {
        this.modules.socket.to(this.client.uid).emit('socket:terminal', packet);
      });
      // now we get the socket where the client id is.
      return Promise.resolve();
    },

    /**************
    func: systemEvent
    params: packet
    describe: function used for broadcasating system evetnts.
    ***************/
    systemEvent(packet) {
      packet.data._id = packet.id;
      setImmediate(() => {
        this.modules.socket.to(packet.client.uid).emit(packet.event, packet.data);
      });
      // now we get the socket where the client id is.
      return Promise.resolve();
    },

    /**************
    func: emit
    params: opts - say & message
    describe: Emit a message to the say event
    ***************/
    emit(opts) {
      this.modules.socket.emit(opts.say, opts.message);
      return Promise.resolve();
    },
  },
  methods: {
    /**************
    method: status
    params: packet
    describe: Return the socket deva status.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: Return the Socket Deva help.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(help => {
          return this.question(`#feecting parse ${help}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(reject);
      });
    },
  },

  /**************
  func: onStart
  params: none
  describe: The onStart function sets up the necessary socket module for the deva
  and watches for disconnect and client:data events before joining a private
  socket..
  ***************/
  onStart() {
    this.modules.socket = Socket(this.modules.server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
      }
    });
    this.modules.socket.on('connection', socket => {
      socket
        .on('disconnect', () => {})
        .on('client:data', data => {
          socket.join(data.uid);
        });
    });
    return this.enter();
  },

  /**************
  func: onInit
  params: none
  describe: The onInit function sets the socket port and server information
  and prompts it to the user console before returning the this.start() function.
  ***************/
  onInit() {
    this.prompt(`${this.vars.messages.init} PORT:${this.vars.port}`);
    this.modules.server.listen(this.vars.port);
    return this.start();
  },
});
module.exports = SOCKET
