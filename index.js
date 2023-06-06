// Copyright (c)2022 Quinn Michaels
// The Socket Deva
const Deva = require('@indra.ai/deva');
const fs = require('fs');
const path = require('path');
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  dir: __dirname,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Socket = require('socket.io');

const SOCKET = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim();},
  },
  listeners: {
    /**************
    func: socket
    params: packet
    describe: Socket listener that sends the broadcast event to the available
    socket.
    ***************/
    'socket:global'(packet) {
      if (!packet || !this._active) return;
      this.func.emit('socket:global', packet).then(() => {
        this.talk(`socket:global:${packet.id}`, packet);
      });
    },

    /**************
    func: socket:terminal
    params: packet
    describe: pass a message to the socket terminal then talk a response when
    the socket broadcast is complete from the socketTreminal function.
    ***************/
    'socket:client'(packet) {
      if (!packet || !this._active) return;
      this.func.to(packet).then(result => {
        this.talk(`socket:client:${packet.id}`, true)
      });
    },

    /**************
    func: socket:event
    params: packet
    describe: pass a message to the socket event then talk a response when
    the socket broadcast is complete from the socketTreminal function.
    ***************/
    'socket:event'(packet) {
      if (!packet || !this._active) return;
      this.func.event(packet).then(result => {
        this.talk(`socket:event:${packet.id}`, true)
      });
    },

    /**************
    func: error
    params: packet
    describe: Broadcast errors to the socket.
    ***************/
    'error'(packet) {
      if (!packet || !this._active) return;
      this.func.emit({say:'error', message:packet});
    },
  },
  modules: {
    server: require('http').createServer(),
    socket: false,
  },
  sockets: {},
  deva: {},
  func: {
    /**************
    func: to
    params: packet
    describe: Send the packet information to the available socket terminal.
    ***************/
    to(packet) {
      // this is where we emit to the client socket oh yeah
      setImmediate(() => {
        this.modules.socket.to(`client:${packet.q.client.id}`).emit('socket:client', packet);
      });
      // now we get the socket where the client id is.
      return Promise.resolve();
    },

    /**************
    func: emit
    params: opts - say & message
    describe: Emit a message to the say event
    ***************/
    emit(event, data) {
      this.modules.socket.emit(event, data);
      return Promise.resolve();
    },
    /**************
    func: event
    params: opts - say & message
    describe: send the value to a the key event
    ***************/
    event(opts) {
      this.modules.socket.emit(opts.event, opts);
      return Promise.resolve();
    },
  },
  methods: {},
  /**************
  func: onDone
  params: data
  describe: The onStart function sets up the necessary socket module for the deva
  and watches for disconnect and client:data events before joining a private
  socket..
  ***************/
  onDone(data) {
    this.prompt(this.vars.messages.config);
    this.modules.socket = Socket(this.modules.server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
      }
    });
    this.modules.socket.on('connection', socket => {
      socket.join(`client:${data.client.id}`);
      socket.emit('socket:clientdata', data.client);
      socket.on('disconnect', () => {})
        // .on('client:data', data => {
        //   socket.join(data.id);
        // });
    });

    this.listen('devacore:prompt', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:context', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:state', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:feature', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:action', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    this.listen('devacore:zone', packet => {
      this.func.emit(`${agent.key}:devacore`, packet);
    });
    return Promise.resolve(data);
  },

  /**************
  func: onInit
  params: none
  describe: The onInit function sets the socket port and server information
  and prompts it to the user console before returning the this.start() function.
  ***************/
  onInit(data) {
    this.prompt(`${this.vars.messages.init} port:${this.config.ports.socket}`);
    this.modules.server.listen(this.config.ports.socket);
    return this.start(data);
  },
});
module.exports = SOCKET
